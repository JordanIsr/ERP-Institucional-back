import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paralelo } from './entities/paralelo.entity';
import { CreateParaleloDto } from './dto/create-paralelo.dto';
import { UpdateParaleloDto } from './dto/update-paralelo.dto';
import { PeriodoCarreraService } from '../periodo-carrera/periodo-carrera.service';
import { NivelService } from '../mallas/nivel.service';
import { AulaService } from '../aula/aula.service';

@Injectable()
export class ParaleloService {
  constructor(
    @InjectRepository(Paralelo)
    private readonly paraleloRepository: Repository<Paralelo>,
    private readonly periodoCarreraService: PeriodoCarreraService,
    private readonly nivelService: NivelService,
    private readonly aulaService: AulaService,
  ) {}

  async create(dto: CreateParaleloDto) {
    const periodoCarrera = await this.periodoCarreraService.findOne(dto.periodoCarreraId);
    const nivel = await this.nivelService.findOne(dto.nivelId);
    const aula = await this.aulaService.findOne(dto.aulaId);

    if (nivel.versionMalla.id !== periodoCarrera.versionMalla.id) {
      throw new BadRequestException(
        `El nivel "${nivel.nombre}" pertenece a la malla "${nivel.versionMalla.nombre}", pero este periodo-carrera usa la malla "${periodoCarrera.versionMalla.nombre}". No se pueden mezclar.`,
      );
    }

    if (dto.cupoMaximo > aula.capacidadMaxima) {
      throw new BadRequestException(
        `El cupo solicitado (${dto.cupoMaximo}) supera la capacidad máxima del aula "${aula.nombre}" (${aula.capacidadMaxima}).`,
      );
    }

    const existe = await this.paraleloRepository.findOne({
      where: {
        periodoCarrera: { id: periodoCarrera.id },
        nivel: { id: nivel.id },
        nombre: dto.nombre,
      },
    });
    if (existe) {
      throw new ConflictException(
        `Ya existe el Paralelo "${dto.nombre}" para el nivel "${nivel.nombre}" en este periodo-carrera.`,
      );
    }

    const nuevo = this.paraleloRepository.create({
      periodoCarrera,
      nivel,
      aula,
      nombre: dto.nombre,
      cupoMaximo: dto.cupoMaximo,
    });

    return this.paraleloRepository.save(nuevo);
  }

  findAll(filtros?: { periodoCarreraId?: string; nivelId?: string }) {
    const where: any = {};
    if (filtros?.periodoCarreraId) where.periodoCarrera = { id: filtros.periodoCarreraId };
    if (filtros?.nivelId) where.nivel = { id: filtros.nivelId };

    return this.paraleloRepository.find({
      where: Object.keys(where).length ? where : undefined,
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const paralelo = await this.paraleloRepository.findOne({ where: { id } });
    if (!paralelo) {
      throw new NotFoundException(`Paralelo con ID ${id} no encontrado.`);
    }
    return paralelo;
  }

  async update(id: string, dto: UpdateParaleloDto) {
    await this.findOne(id);
    await this.paraleloRepository.update(id, { nombre: dto.nombre, cupoMaximo: dto.cupoMaximo });
    return this.findOne(id);
  }

  async remove(id: string) {
    const paralelo = await this.findOne(id);
    await this.paraleloRepository.remove(paralelo);
    return { message: `Paralelo "${paralelo.nombre}" eliminado exitosamente.` };
  }
}