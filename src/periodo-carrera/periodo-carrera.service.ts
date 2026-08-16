import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodoCarrera } from './entities/periodo-carrera.entity';
import { CreatePeriodoCarreraDto } from './dto/create-periodo-carrera.dto';
import { UpdatePeriodoCarreraDto } from './dto/update-periodo-carrera.dto';
import { PeriodosService } from '../periodos/periodos.service';
import { CarrerasService } from '../carreras/carreras.service';
import { VersionMallaService } from '../mallas/version-malla.service';
import { EstadoVersionMalla } from '../mallas/entities/version-malla.entity';
import { EstadoPeriodo } from '../periodos/entities/periodo-academico.entity';
import { CentrosEstudioService } from '../centros-estudio/centros-estudio.service';

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
    const versionMalla = await this.versionMallaService.findOne(dto.versionMallaId);
    const centroEstudio = await this.centrosEstudioService.findOne(dto.centroEstudioId);

    if (periodo.estado === EstadoPeriodo.CERRADO) {
      throw new BadRequestException(
        `No se puede crear el registro: el periodo "${periodo.nombre}" ya está CERRADO.`,
      );
    }

    if (versionMalla.estado !== EstadoVersionMalla.ACTIVA) {
      throw new BadRequestException(
        `No se puede usar la malla "${versionMalla.nombre}" porque su estado es ${versionMalla.estado}. Solo se permiten mallas ACTIVA.`,
      );
    }

    const existe = await this.periodoCarreraRepository.findOne({
      where: {
        periodo: { id: periodo.id },
        carrera: { id: carrera.id },
        jornada: dto.jornada,
        centroEstudio: { id: centroEstudio.id },
      },
    });
    if (existe) {
      throw new ConflictException(
        `Ya existe un registro para "${carrera.nombre}" en el periodo "${periodo.nombre}" con jornada ${dto.jornada} en el centro "${centroEstudio.nombre}".`,
      );
    }

    const nuevo = this.periodoCarreraRepository.create({
      periodo,
      carrera,
      versionMalla,
      centroEstudio,
      jornada: dto.jornada,
    });

    return this.periodoCarreraRepository.save(nuevo);
  }

  findAll(filtros?: { periodoId?: string; carreraId?: string }) {
    const where: any = {};
    if (filtros?.periodoId) where.periodo = { id: filtros.periodoId };
    if (filtros?.carreraId) where.carrera = { id: filtros.carreraId };

    return this.periodoCarreraRepository.find({
      where: Object.keys(where).length ? where : undefined,
      order: { jornada: 'ASC' },
    });
  }

  async findOne(id: string) {
    const registro = await this.periodoCarreraRepository.findOne({ where: { id } });
    if (!registro) {
      throw new NotFoundException(`Registro de PeriodoCarrera con ID ${id} no encontrado.`);
    }
    return registro;
  }

  async update(id: string, dto: UpdatePeriodoCarreraDto) {
    const registro = await this.findOne(id);

    let versionMalla = registro.versionMalla;
    if (dto.versionMallaId && dto.versionMallaId !== registro.versionMalla.id) {
      versionMalla = await this.versionMallaService.findOne(dto.versionMallaId);
      if (versionMalla.estado !== EstadoVersionMalla.ACTIVA) {
        throw new BadRequestException(
          `No se puede usar la malla "${versionMalla.nombre}" porque su estado es ${versionMalla.estado}. Solo se permiten mallas ACTIVA.`,
        );
      }
    }

    await this.periodoCarreraRepository.save({
      ...registro,
      jornada: dto.jornada ?? registro.jornada,
      versionMalla,
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const registro = await this.findOne(id);
    await this.periodoCarreraRepository.remove(registro);
    return { message: 'Registro de PeriodoCarrera eliminado exitosamente.' };
  }
}