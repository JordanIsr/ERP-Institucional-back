import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodoAcademico } from './entities/periodo-academico.entity';
import { CreatePeriodoDto } from './dto/create-periodo.dto';
import { UpdatePeriodoDto } from './dto/update-periodo.dto';

@Injectable()
export class PeriodosService {
  constructor(
    @InjectRepository(PeriodoAcademico)
    private readonly periodoRepository: Repository<PeriodoAcademico>,
  ) {}

  private validarFechas(fechaInicio: string, fechaFin: string) {
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio.');
    }
  }

  async create(dto: CreatePeriodoDto) {
    const existeNombre = await this.periodoRepository.findOne({ where: { nombre: dto.nombre } });
    if (existeNombre) {
      throw new ConflictException(`Ya existe un periodo con el nombre "${dto.nombre}".`);
    }

    this.validarFechas(dto.fechaInicio, dto.fechaFin);

    const nuevo = this.periodoRepository.create(dto);
    return this.periodoRepository.save(nuevo);
  }

  findAll() {
    return this.periodoRepository.find({ order: { fechaInicio: 'DESC' } });
  }

  async findOne(id: string) {
    const periodo = await this.periodoRepository.findOne({ where: { id } });
    if (!periodo) {
      throw new NotFoundException(`Periodo con ID ${id} no encontrado.`);
    }
    return periodo;
  }

  async update(id: string, dto: UpdatePeriodoDto) {
    const periodo = await this.findOne(id);

    if (dto.nombre) {
      const existeNombre = await this.periodoRepository.findOne({ where: { nombre: dto.nombre } });
      if (existeNombre && existeNombre.id !== id) {
        throw new ConflictException(`Ya existe otro periodo con el nombre "${dto.nombre}".`);
      }
    }

    const fechaInicio = dto.fechaInicio ?? periodo.fechaInicio;
    const fechaFin = dto.fechaFin ?? periodo.fechaFin;
    this.validarFechas(fechaInicio, fechaFin);

    await this.periodoRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const periodo = await this.findOne(id);

    // RN (futuro): no eliminar periodos con PeriodoCarrera asociado.
    // const enUso = await this.periodoCarreraService.existeUsoDePeriodo(id);
    // if (enUso) {
    //   throw new ConflictException('No se puede eliminar: este periodo tiene carreras habilitadas.');
    // }

    await this.periodoRepository.remove(periodo);
    return { message: `Periodo "${periodo.nombre}" eliminado exitosamente.` };
  }
}