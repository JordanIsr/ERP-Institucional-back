import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrera } from './entities/carrera.entity';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { UpdateCarreraDto } from './dto/update-carrera.dto';

@Injectable()
export class CarrerasService {
  constructor(
    @InjectRepository(Carrera)
    private readonly carreraRepository: Repository<Carrera>,
  ) {}

  async create(dto: CreateCarreraDto) {
    const existeCodigo = await this.carreraRepository.findOne({ where: { codigo: dto.codigo } });
    if (existeCodigo) {
      throw new ConflictException(`Ya existe una carrera con el código "${dto.codigo}".`);
    }

    const nueva = this.carreraRepository.create(dto);
    return this.carreraRepository.save(nueva);
  }

  findAll() {
    return this.carreraRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string) {
    const carrera = await this.carreraRepository.findOne({ where: { id } });
    if (!carrera) {
      throw new NotFoundException(`Carrera con ID ${id} no encontrada.`);
    }
    return carrera;
  }

  async update(id: string, dto: UpdateCarreraDto) {
    await this.findOne(id);

    if (dto.codigo) {
      const existeCodigo = await this.carreraRepository.findOne({ where: { codigo: dto.codigo } });
      if (existeCodigo && existeCodigo.id !== id) {
        throw new ConflictException(`Ya existe otra carrera con el código "${dto.codigo}".`);
      }
    }

    await this.carreraRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const carrera = await this.findOne(id);

    // RN12: no eliminar carreras con Versiones de Malla asociadas.
    // Se activa cuando exista VersionMallaService (siguiente módulo a construir):
    //
    // const tieneMallas = await this.versionMallaService.existeMallaDeCarrera(id);
    // if (tieneMallas) {
    //   throw new ConflictException('No se puede eliminar: esta carrera tiene versiones de malla asociadas. Puedes desactivarla en su lugar.');
    // }

    await this.carreraRepository.remove(carrera);
    return { message: `Carrera "${carrera.nombre}" eliminada exitosamente.` };
  }
}