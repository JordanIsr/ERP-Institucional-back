import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aula } from './entities/aula.entity';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';

@Injectable()
export class AulaService {
  constructor(
    @InjectRepository(Aula)
    private readonly aulaRepository: Repository<Aula>,
  ) {}

  async create(dto: CreateAulaDto) {
    const existe = await this.aulaRepository.findOne({
      where: { nombre: dto.nombre },
    });

    if (existe) {
      throw new ConflictException(`Ya existe un aula registrada con el nombre "${dto.nombre}".`);
    }

    const nuevaAula = this.aulaRepository.create(dto);
    return await this.aulaRepository.save(nuevaAula);
  }

  findAll(soloActivos: boolean = true) {
    return this.aulaRepository.find({
      where: soloActivos ? { activo: true } : {},
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const aula = await this.aulaRepository.findOne({ where: { id } });
    
    if (!aula) {
      throw new NotFoundException(`Aula con ID "${id}" no encontrada.`);
    }
    
    return aula;
  }

  async update(id: string, dto: UpdateAulaDto) {
    await this.findOne(id);
    await this.aulaRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const aula = await this.findOne(id);
    // Borrado lógico deshabilitando el aula
    aula.activo = false;
    await this.aulaRepository.save(aula);
    return { message: `Aula "${aula.nombre}" desactivada correctamente.` };
  }
}