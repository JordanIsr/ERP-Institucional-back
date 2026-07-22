import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Docente } from './entities/docente.entity';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';

@Injectable()
export class DocentesService {
  constructor(
    @InjectRepository(Docente)
    private readonly docenteRepository: Repository<Docente>,
  ) {}

  async create(dto: CreateDocenteDto) {
    const existeCedula = await this.docenteRepository.findOne({ where: { cedula: dto.cedula } });
    if (existeCedula) {
      throw new ConflictException(`Ya existe un docente con la cédula "${dto.cedula}".`);
    }

    const nuevo = this.docenteRepository.create(dto);
    return this.docenteRepository.save(nuevo);
  }

  findAll() {
    return this.docenteRepository.find({ order: { apellidos: 'ASC' } });
  }

  async findOne(id: string) {
    const docente = await this.docenteRepository.findOne({ where: { id } });
    if (!docente) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado.`);
    }
    return docente;
  }

  async update(id: string, dto: UpdateDocenteDto) {
    await this.findOne(id);

    if (dto.cedula) {
      const existeCedula = await this.docenteRepository.findOne({ where: { cedula: dto.cedula } });
      if (existeCedula && existeCedula.id !== id) {
        throw new ConflictException(`Ya existe otro docente con la cédula "${dto.cedula}".`);
      }
    }

    await this.docenteRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const docente = await this.findOne(id);

    // RN (futuro): no eliminar docentes con Paralelos asignados.
    // const tieneParalelos = await this.paralelosService.existeAsignacionDeDocente(id);
    // if (tieneParalelos) {
    //   throw new ConflictException('No se puede eliminar: este docente tiene paralelos asignados.');
    // }

    await this.docenteRepository.remove(docente);
    return { message: `Docente "${docente.nombres} ${docente.apellidos}" eliminado exitosamente.` };
  }
}