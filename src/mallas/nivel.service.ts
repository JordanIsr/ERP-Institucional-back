import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nivel } from './entities/nivel.entity';
import { CreateNivelDto } from './dto/create-nivel.dto';
import { UpdateNivelDto } from './dto/update-nivel.dto';
import { VersionMallaService } from './version-malla.service';

@Injectable()
export class NivelService {
  constructor(
    @InjectRepository(Nivel)
    private readonly nivelRepository: Repository<Nivel>,
    private readonly versionMallaService: VersionMallaService,
  ) {}

  async create(dto: CreateNivelDto) {
    const versionMalla = await this.versionMallaService.findOne(dto.versionMallaId);

    const existeNumero = await this.nivelRepository.findOne({
      where: { versionMalla: { id: versionMalla.id }, numero: dto.numero },
    });
    if (existeNumero) {
      throw new ConflictException(`Ya existe el Nivel ${dto.numero} en esta versión de malla.`);
    }

    const nuevo = this.nivelRepository.create({
      versionMalla,
      numero: dto.numero,
      nombre: dto.nombre ?? `Nivel ${dto.numero}`,
    });

    return this.nivelRepository.save(nuevo);
  }

  findAll(versionMallaId?: string) {
    if (versionMallaId) {
      return this.nivelRepository.find({
        where: { versionMalla: { id: versionMallaId } },
        relations: { versionMalla: true },
        order: { numero: 'ASC' },
      });
    }
    return this.nivelRepository.find({ relations: { versionMalla: true }, order: { numero: 'ASC' } });
  }

  async findOne(id: string) {
    const nivel = await this.nivelRepository.findOne({ where: { id }, relations: { versionMalla: true } });
    if (!nivel) {
      throw new NotFoundException(`Nivel con ID ${id} no encontrado.`);
    }
    return nivel;
  }

  async update(id: string, dto: UpdateNivelDto) {
    const nivel = await this.findOne(id);

    if (dto.numero && dto.numero !== nivel.numero) {
      const existeNumero = await this.nivelRepository.findOne({
        where: { versionMalla: { id: nivel.versionMalla.id }, numero: dto.numero },
      });
      if (existeNumero) {
        throw new ConflictException(`Ya existe el Nivel ${dto.numero} en esta versión de malla.`);
      }
    }

    await this.nivelRepository.update(id, { numero: dto.numero, nombre: dto.nombre });
    return this.findOne(id);
  }

  async remove(id: string) {
    const nivel = await this.findOne(id);

    const tieneDetalle = await this.nivelRepository
      .createQueryBuilder('n')
      .leftJoin('n.detalles', 'd')
      .where('n.id = :id', { id })
      .andWhere('d.id IS NOT NULL')
      .getCount();

    if (tieneDetalle > 0) {
      throw new ConflictException(
        'No se puede eliminar: este nivel tiene asignaturas asociadas. Quita primero las asignaturas del detalle de malla.',
      );
    }

    await this.nivelRepository.remove(nivel);
    return { message: `Nivel "${nivel.nombre}" eliminado exitosamente.` };
  }
}