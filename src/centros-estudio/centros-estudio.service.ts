import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CentroEstudio } from './entities/centro-estudio.entity';
import { CreateCentroEstudioDto } from './dto/create-centro-estudio.dto';
import { UpdateCentroEstudioDto } from './dto/update-centro-estudio.dto';

@Injectable()
export class CentrosEstudioService {
  constructor(
    @InjectRepository(CentroEstudio)
    private readonly centroEstudioRepository: Repository<CentroEstudio>,
  ) {}

  async create(dto: CreateCentroEstudioDto) {
    const existe = await this.centroEstudioRepository.findOne({
      where: { codigo: dto.codigo },
    });
    if (existe) {
      throw new ConflictException(`Ya existe un centro de estudio con el código "${dto.codigo}".`);
    }

    const nuevo = this.centroEstudioRepository.create(dto);
    return this.centroEstudioRepository.save(nuevo);
  }

  findAll() {
    return this.centroEstudioRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string) {
    const centro = await this.centroEstudioRepository.findOne({ where: { id } });
    if (!centro) {
      throw new NotFoundException(`Centro de estudio con ID ${id} no encontrado.`);
    }
    return centro;
  }

  async update(id: string, dto: UpdateCentroEstudioDto) {
    await this.findOne(id);
    await this.centroEstudioRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const centro = await this.findOne(id);
    await this.centroEstudioRepository.remove(centro);
    return { message: `Centro de estudio "${centro.nombre}" eliminado exitosamente.` };
  }
}