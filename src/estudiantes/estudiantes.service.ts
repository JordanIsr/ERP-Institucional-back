import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estudiante } from './entities/estudiante.entity';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';

@Injectable()
export class EstudiantesService {
  
  constructor(
    @InjectRepository(Estudiante)
    private readonly estudianteRepository: Repository<Estudiante>,
  ) {}

  async create(createEstudianteDto: CreateEstudianteDto) {
    const existeCedula = await this.estudianteRepository.findOne({
      where: { cedula: createEstudianteDto.cedula }
    });
    
    if (existeCedula) {
      throw new ConflictException('Un estudiante con esta cédula ya existe.');
    }

    const nuevoEstudiante = this.estudianteRepository.create(createEstudianteDto);
    return await this.estudianteRepository.save(nuevoEstudiante);
  }

  async findAll() {
    return await this.estudianteRepository.find();
  }

  async findOne(id: string) {
    const estudiante = await this.estudianteRepository.findOne({ where: { id } });
    if (!estudiante) {
      throw new NotFoundException(`Estudiante con ID ${id} no fue encontrado`);
    }
    return estudiante;
  }

  async update(id: string, updateEstudianteDto: UpdateEstudianteDto) {
    await this.findOne(id);
    await this.estudianteRepository.update(id, updateEstudianteDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const estudiante = await this.findOne(id);
    await this.estudianteRepository.remove(estudiante);
    return { message: `Estudiante con ID ${id} eliminado exitosamente` };
  }
}