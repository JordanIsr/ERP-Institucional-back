import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asignatura } from './entities/asignatura.entity';
import { CreateAsignaturaDto } from './dto/create-asignatura.dto';
import { UpdateAsignaturaDto } from './dto/update-asignatura.dto';

@Injectable()
export class AsignaturasService {
  constructor(
    @InjectRepository(Asignatura)
    private readonly asignaturaRepository: Repository<Asignatura>,
  ) {}

  async create(dto: CreateAsignaturaDto) {
    const existeCodigo = await this.asignaturaRepository.findOne({ where: { codigo: dto.codigo } });
    if (existeCodigo) {
      throw new ConflictException(`Ya existe una asignatura con el código "${dto.codigo}".`);
    }

    const nueva = this.asignaturaRepository.create(dto);
    return this.asignaturaRepository.save(nueva);
  }

  findAll() {
    return this.asignaturaRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string) {
    const asignatura = await this.asignaturaRepository.findOne({ where: { id } });
    if (!asignatura) {
      throw new NotFoundException(`Asignatura con ID ${id} no encontrada.`);
    }
    return asignatura;
  }

  async update(id: string, dto: UpdateAsignaturaDto) {
    await this.findOne(id);

    if (dto.codigo) {
      const existeCodigo = await this.asignaturaRepository.findOne({ where: { codigo: dto.codigo } });
      if (existeCodigo && existeCodigo.id !== id) {
        throw new ConflictException(`Ya existe otra asignatura con el código "${dto.codigo}".`);
      }
    }

    await this.asignaturaRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const asignatura = await this.findOne(id);

    // RN: no eliminar asignaturas usadas en algún Detalle de Malla.
    // Esta verificación se activa cuando exista el módulo de mallas (DetalleMallaService),
    // por ahora se deja el bloque comentado como recordatorio explícito para no olvidarlo:
    //
    // const enUso = await this.detalleMallaService.existeUsoDeAsignatura(id);
    // if (enUso) {
    //   throw new ConflictException('No se puede eliminar: esta asignatura está en uso en una o más mallas curriculares.');
    // }

    await this.asignaturaRepository.remove(asignatura);
    return { message: `Asignatura "${asignatura.nombre}" eliminada exitosamente.` };
  }

  async buscarOCrear(nombre: string): Promise<Asignatura> {
  const nombreLimpio = nombre.trim();

  const existente = await this.asignaturaRepository.findOne({
    where: { nombre: nombreLimpio },
  });
  if (existente) return existente;

  // Genera un código automático si el usuario no lo especificó (ej. "MATEMATICAS-A3F9")
  const codigoAuto = nombreLimpio
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12) + '-' + Math.random().toString(36).slice(-4).toUpperCase();

  const nueva = this.asignaturaRepository.create({ nombre: nombreLimpio, codigo: codigoAuto });
  return this.asignaturaRepository.save(nueva);
}

}