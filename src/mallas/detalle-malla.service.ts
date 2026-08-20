import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleMalla } from './entities/detalle-malla.entity';
import { CreateDetalleMallaDto } from './dto/create-detalle-malla.dto';
import { NivelService } from './nivel.service';
import { AsignaturasService } from '../asignaturas/asignaturas.service';

@Injectable()
export class DetalleMallaService {
  constructor(
    @InjectRepository(DetalleMalla)
    private readonly detalleRepository: Repository<DetalleMalla>,
    private readonly nivelService: NivelService,
    private readonly asignaturasService: AsignaturasService,
  ) {}

  async agregar(dto: CreateDetalleMallaDto) {
    const nivel = await this.nivelService.findOne(dto.nivelId);
    const asignatura = await this.asignaturasService.findOne(dto.asignaturaId);

    const existe = await this.detalleRepository.findOne({
      where: { nivel: { id: nivel.id }, asignatura: { id: asignatura.id } },
    });
    if (existe) {
      throw new ConflictException(`La asignatura "${asignatura.nombre}" ya está agregada a este nivel.`);
    }

    const nuevo = this.detalleRepository.create({ nivel, asignatura });
    return this.detalleRepository.save(nuevo);
  }

  listarPorNivel(nivelId: string) {
    return this.detalleRepository.find({
      where: { nivel: { id: nivelId } },
      relations: { asignatura: true },
    });
  }

  async quitar(id: string) {
    const detalle = await this.detalleRepository.findOne({ where: { id } });
    if (!detalle) {
      throw new NotFoundException(`Registro de detalle de malla con ID ${id} no encontrado.`);
    }
    await this.detalleRepository.remove(detalle);
    return { message: 'Asignatura removida del nivel exitosamente.' };
  }

  async findOne(id: string) {
    const detalle = await this.detalleRepository.findOne({
      where: { id },
      relations: { nivel: true, asignatura: true },
    });
    if (!detalle) {
      throw new NotFoundException(`Registro de detalle de malla con ID ${id} no encontrado.`);
    }
    return detalle;
  }
}