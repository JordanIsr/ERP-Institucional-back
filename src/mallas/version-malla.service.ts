import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VersionMalla, EstadoVersionMalla } from './entities/version-malla.entity';
import { CreateVersionMallaDto } from './dto/create-version-malla.dto';
import { UpdateVersionMallaDto } from './dto/update-version-malla.dto';
import { CarrerasService } from '../carreras/carreras.service';

@Injectable()
export class VersionMallaService {
  constructor(
    @InjectRepository(VersionMalla)
    private readonly versionMallaRepository: Repository<VersionMalla>,
    private readonly carrerasService: CarrerasService,
  ) {}

  async create(dto: CreateVersionMallaDto) {
    const carrera = await this.carrerasService.findOne(dto.carreraId);
    const quiereActivarla = dto.estado === EstadoVersionMalla.ACTIVA;

    const nueva = this.versionMallaRepository.create({
      carrera,
      nombre: dto.nombre,
      version: dto.version,
      fechaVigenciaInicio: dto.fechaVigenciaInicio,
      fechaVigenciaFin: dto.fechaVigenciaFin,
      // Nunca se guarda como ACTIVA directamente aquí — eso es responsabilidad exclusiva de activar()
      estado: quiereActivarla ? EstadoVersionMalla.PROXIMA : (dto.estado ?? EstadoVersionMalla.PROXIMA),
    });

    const guardada = await this.versionMallaRepository.save(nueva);

    if (quiereActivarla) {
      return this.activar(guardada.id);
    }

    return this.findOne(guardada.id);
  }

  findAll(carreraId?: string) {
    if (carreraId) {
      return this.versionMallaRepository.find({
        where: { carrera: { id: carreraId } },
        order: { fechaVigenciaInicio: 'DESC' },
      });
    }
    return this.versionMallaRepository.find({ order: { fechaVigenciaInicio: 'DESC' } });
  }

  async findOne(id: string) {
    const version = await this.versionMallaRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Versión de malla con ID ${id} no encontrada.`);
    }
    return version;
  }

  async update(id: string, dto: UpdateVersionMallaDto) {
    const version = await this.findOne(id);

    if (dto.estado === EstadoVersionMalla.ACTIVA && version.estado !== EstadoVersionMalla.ACTIVA) {
      const { estado, ...resto } = dto;
      if (Object.keys(resto).length > 0) {
        await this.versionMallaRepository.update(id, resto);
      }
      return this.activar(id);
    }

    await this.versionMallaRepository.update(id, dto);
    return this.findOne(id);
  }

  /**
   * Activa esta versión y, en la misma transacción, pasa a HISTORICA
   * TODAS las demás versiones ACTIVAS de la misma carrera (RN11).
   */
  async activar(id: string) {
    const version = await this.versionMallaRepository.findOne({ where: { id }, relations: { carrera: true } });
    if (!version) {
      throw new NotFoundException(`Versión de malla con ID ${id} no encontrada.`);
    }

    await this.versionMallaRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(VersionMalla);

      // find() en vez de findOne(): atrapa TODAS las que estén activas, no solo una
      const otrasActivas = await repo.find({
        where: { carrera: { id: version.carrera.id }, estado: EstadoVersionMalla.ACTIVA },
      });

      for (const otra of otrasActivas) {
        if (otra.id === id) continue; // no se desactiva a sí misma
        otra.estado = EstadoVersionMalla.HISTORICA;
        otra.fechaVigenciaFin = otra.fechaVigenciaFin ?? new Date().toISOString().slice(0, 10);
        await repo.save(otra);
      }

      version.estado = EstadoVersionMalla.ACTIVA;
      await repo.save(version);
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const version = await this.findOne(id);

    const tieneNiveles = await this.versionMallaRepository
      .createQueryBuilder('v')
      .leftJoin('v.niveles', 'n')
      .where('v.id = :id', { id })
      .andWhere('n.id IS NOT NULL')
      .getCount();

    if (tieneNiveles > 0) {
      throw new ConflictException(
        'No se puede eliminar: esta versión de malla ya tiene niveles definidos. Elimina primero los niveles, o márcala como HISTORICA en lugar de borrarla.',
      );
    }

    await this.versionMallaRepository.remove(version);
    return { message: `Versión de malla "${version.nombre}" eliminada exitosamente.` };
  }
}