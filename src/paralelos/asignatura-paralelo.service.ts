import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsignaturaParalelo } from './entities/asignatura-paralelo.entity';
import { CreateAsignaturaParaleloDto } from './dto/create-asignatura-paralelo.dto';
import { ParaleloService } from './paralelo.service';
import { DetalleMallaService } from '../mallas/detalle-malla.service';
import { DocentesService } from '../docentes/docentes.service';
import { EstadoDocente } from '../docentes/entities/docente.entity';

@Injectable()
export class AsignaturaParaleloService {
  constructor(
    @InjectRepository(AsignaturaParalelo)
    private readonly asignaturaParaleloRepository: Repository<AsignaturaParalelo>,
    private readonly paraleloService: ParaleloService,
    private readonly detalleMallaService: DetalleMallaService,
    private readonly docentesService: DocentesService,
  ) {}

  async agregar(dto: CreateAsignaturaParaleloDto) {
    const paralelo = await this.paraleloService.findOne(dto.paraleloId);
    const detalleMalla = await this.detalleMallaService.findOne(dto.detalleMallaId);
    const docente = await this.docentesService.findOne(dto.docenteId);

    // Validación: la asignatura (vía detalleMalla) debe pertenecer al mismo Nivel que tiene el Paralelo
    if (detalleMalla.nivel.id !== paralelo.nivel.id) {
      throw new BadRequestException(
        `La asignatura "${detalleMalla.asignatura.nombre}" no pertenece al nivel "${paralelo.nivel.nombre}" de este paralelo.`,
      );
    }

    if (docente.estado !== EstadoDocente.ACTIVO) {
      throw new BadRequestException(
        `No se puede asignar al docente "${docente.nombres} ${docente.apellidos}" porque su estado es ${docente.estado}.`,
      );
    }

    const existe = await this.asignaturaParaleloRepository.findOne({
      where: { paralelo: { id: paralelo.id }, detalleMalla: { id: detalleMalla.id } },
    });
    if (existe) {
      throw new ConflictException(
        `La asignatura "${detalleMalla.asignatura.nombre}" ya está agregada a este paralelo.`,
      );
    }

    const nuevo = this.asignaturaParaleloRepository.create({ paralelo, detalleMalla, docente });
    return this.asignaturaParaleloRepository.save(nuevo);
  }

  listarPorParalelo(paraleloId: string) {
    return this.asignaturaParaleloRepository.find({
      where: { paralelo: { id: paraleloId } },
    });
  }

  async quitar(id: string) {
    const registro = await this.asignaturaParaleloRepository.findOne({ where: { id } });
    if (!registro) {
      throw new NotFoundException(`Registro con ID ${id} no encontrado.`);
    }
    await this.asignaturaParaleloRepository.remove(registro);
    return { message: 'Asignatura removida del paralelo exitosamente.' };
  }
}