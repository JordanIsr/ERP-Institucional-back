import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { EstadoPeriodoCarrera, PeriodoCarrera } from './entities/periodo-carrera.entity';
import { CreatePeriodoCarreraDto } from './dto/create-periodo-carrera.dto';
import { UpdatePeriodoCarreraDto } from './dto/update-periodo-carrera.dto';

import { PeriodosService } from '../periodos/periodos.service';
import { CarrerasService } from '../carreras/carreras.service';
import { VersionMallaService } from '../mallas/version-malla.service';
import { CentrosEstudioService } from '../centros-estudio/centros-estudio.service';

import { EstadoPeriodo } from '../periodos/entities/periodo-academico.entity';
import { EstadoVersionMalla } from '../mallas/entities/version-malla.entity';

@Injectable()
export class PeriodoCarreraService {
  constructor(
    @InjectRepository(PeriodoCarrera)
    private readonly periodoCarreraRepository: Repository<PeriodoCarrera>,
    private readonly periodosService: PeriodosService,
    private readonly carrerasService: CarrerasService,
    private readonly versionMallaService: VersionMallaService,
    private readonly centrosEstudioService: CentrosEstudioService,
  ) {}

  async create(dto: CreatePeriodoCarreraDto) {
    const periodo = await this.periodosService.findOne(dto.periodoId);
    const carrera = await this.carrerasService.findOne(dto.carreraId);
    const versionMalla = dto.versionMallaId
      ? await this.versionMallaService.findOne(dto.versionMallaId)
      : await this.versionMallaService.findActivaPorCarrera(carrera.id);
    const centroEstudio = await this.centrosEstudioService.findOne(
      dto.centroEstudioId,
    );

    if (periodo.estado === EstadoPeriodo.CERRADO) {
      throw new BadRequestException(
        `El periodo "${periodo.nombre}" está cerrado.`,
      );
    }

    if ((carrera as any).estado !== 'ACTIVA') {
      throw new BadRequestException(
        `La carrera "${carrera.nombre}" está inactiva.`,
      );
    }

    if ((centroEstudio as any).estado !== 'ACTIVO') {
      throw new BadRequestException(
        `El centro de estudio "${centroEstudio.nombre}" está inactivo.`,
      );
    }

    if (versionMalla.carrera.id !== carrera.id) {
      throw new BadRequestException(
        `La malla "${versionMalla.nombre}" no pertenece a la carrera "${carrera.nombre}".`,
      );
    }

    /*
     * Una malla histórica puede seguir utilizándose para estudiantes
     * de cohortes antiguas. Una malla PRÓXIMA todavía no puede ofertarse.
     */
    if (versionMalla.estado === EstadoVersionMalla.PROXIMA) {
      throw new BadRequestException(
        `La malla "${versionMalla.nombre}" todavía está en estado PRÓXIMA.`,
      );
    }

    const existe = await this.periodoCarreraRepository.findOne({
      where: {
        periodo: { id: periodo.id },
        carrera: { id: carrera.id },
        jornada: dto.jornada,
        centroEstudio: { id: centroEstudio.id },
        estado: EstadoPeriodoCarrera.ACTIVA,
      },
    });

    if (existe) {
      throw new ConflictException(
        'Ya existe una asociación activa para este periodo, carrera, jornada y centro.',
      );
    }

    const nuevaOferta = this.periodoCarreraRepository.create({
      periodo,
      carrera,
      versionMalla,
      centroEstudio,
      jornada: dto.jornada,
      estado: EstadoPeriodoCarrera.ACTIVA,
    });

    return this.periodoCarreraRepository.save(nuevaOferta);
  }

  findAll(filtros?: {
    periodoId?: string;
    carreraId?: string;
    versionMallaId?: string;
    estado?: EstadoPeriodoCarrera;
  }) {
    const query = this.periodoCarreraRepository
      .createQueryBuilder('oferta')
      .leftJoinAndSelect('oferta.periodo', 'periodo')
      .leftJoinAndSelect('oferta.carrera', 'carrera')
      .leftJoinAndSelect('oferta.versionMalla', 'versionMalla')
      .leftJoinAndSelect('oferta.centroEstudio', 'centroEstudio');

    if (filtros?.periodoId) {
      query.andWhere('periodo.id = :periodoId', {
        periodoId: filtros.periodoId,
      });
    }

    if (filtros?.carreraId) {
      query.andWhere('carrera.id = :carreraId', {
        carreraId: filtros.carreraId,
      });
    }

    if (filtros?.versionMallaId) {
      query.andWhere('versionMalla.id = :versionMallaId', {
        versionMallaId: filtros.versionMallaId,
      });
    }

    if (filtros?.estado) {
      query.andWhere('oferta.estado = :estado', {
        estado: filtros.estado,
      });
    }

    return query
      .orderBy('periodo.fechaInicio', 'DESC')
      .addOrderBy('carrera.nombre', 'ASC')
      .addOrderBy('versionMalla.version', 'ASC')
      .addOrderBy('oferta.jornada', 'ASC')
      .getMany();
  }

  async findOne(id: string) {
    const oferta = await this.periodoCarreraRepository.findOne({
      where: { id },
    });

    if (!oferta) {
      throw new NotFoundException(
        `La oferta académica con ID ${id} no fue encontrada.`,
      );
    }

    return oferta;
  }

  async update(id: string, dto: UpdatePeriodoCarreraDto) {
    const oferta = await this.findOne(id);

    let versionMalla = oferta.versionMalla;

    if (
      dto.versionMallaId &&
      dto.versionMallaId !== oferta.versionMalla.id
    ) {
      versionMalla = await this.versionMallaService.findOne(
        dto.versionMallaId,
      );

      if (versionMalla.carrera.id !== oferta.carrera.id) {
        throw new BadRequestException(
          'La nueva malla no pertenece a la carrera de esta oferta.',
        );
      }

      if (versionMalla.estado === EstadoVersionMalla.PROXIMA) {
        throw new BadRequestException(
          'No se puede utilizar una malla que todavía está en estado PRÓXIMA.',
        );
      }
    }

    const jornada = dto.jornada ?? oferta.jornada;

    const duplicada = await this.periodoCarreraRepository.findOne({
      where: {
        id: Not(id),
        periodo: { id: oferta.periodo.id },
        carrera: { id: oferta.carrera.id },
        versionMalla: { id: versionMalla.id },
        jornada,
        centroEstudio: { id: oferta.centroEstudio.id },
      },
    });

    if (duplicada) {
      throw new ConflictException(
        'Ya existe otra oferta con la misma combinación de periodo, carrera, malla, jornada y centro.',
      );
    }

    oferta.versionMalla = versionMalla;
    oferta.jornada = jornada;
    oferta.estado = dto.estado ?? oferta.estado;

    return this.periodoCarreraRepository.save(oferta);
  }

  /*
   * No eliminamos físicamente la oferta porque posteriormente puede
   * estar relacionada con matrículas, notas e historial académico.
   */
  async remove(id: string) {
    const oferta = await this.findOne(id);
    oferta.estado = EstadoPeriodoCarrera.INACTIVA;

    await this.periodoCarreraRepository.save(oferta);

    return {
      message: 'La oferta académica fue desactivada correctamente.',
    };
  }
}
