import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VersionMalla, EstadoVersionMalla } from './entities/version-malla.entity';
import { Nivel } from './entities/nivel.entity';
import { DetalleMalla } from './entities/detalle-malla.entity';
import { CrearMallaRapidaDto } from './dto/crear-malla-rapida.dto';
import { CarrerasService } from '../carreras/carreras.service';
import { AsignaturasService } from '../asignaturas/asignaturas.service';

@Injectable()
export class MallaWizardService {
  constructor(
    @InjectRepository(VersionMalla) private readonly versionMallaRepo: Repository<VersionMalla>,
    @InjectRepository(Nivel) private readonly nivelRepo: Repository<Nivel>,
    @InjectRepository(DetalleMalla) private readonly detalleRepo: Repository<DetalleMalla>,
    private readonly carrerasService: CarrerasService,
    private readonly asignaturasService: AsignaturasService,
  ) {}

  async crearMallaCompleta(dto: CrearMallaRapidaDto) {
    const carrera = await this.carrerasService.findOne(dto.carreraId);

    return this.versionMallaRepo.manager.transaction(async (manager) => {
      const versionMallaRepo = manager.getRepository(VersionMalla);
      const nivelRepo = manager.getRepository(Nivel);
      const detalleRepo = manager.getRepository(DetalleMalla);

      // 1. Crear la malla como PROXIMA (no ACTIVA todavía — el admin la activa aparte cuando esté lista)
      const malla = versionMallaRepo.create({
        carrera,
        nombre: dto.nombre,
        version: dto.version,
        fechaVigenciaInicio: dto.fechaVigenciaInicio,
        estado: EstadoVersionMalla.PROXIMA,
      });
      const mallaGuardada = await versionMallaRepo.save(malla);

      const resumen: any[] = [];

      // 2. Por cada nivel del asistente...
      for (const nivelDto of dto.niveles) {
        const nivel = nivelRepo.create({
          versionMalla: mallaGuardada,
          numero: nivelDto.numero,
          nombre: `Nivel ${nivelDto.numero}`,
        });
        const nivelGuardado = await nivelRepo.save(nivel);

        const asignaturasDelNivel: string[] = [];

        // 3. Por cada nombre de asignatura escrito: buscar o crear en el catálogo, luego enlazar
        for (const nombreAsignatura of nivelDto.asignaturas) {
          if (!nombreAsignatura?.trim()) continue;

          const asignatura = await this.asignaturasService.buscarOCrear(nombreAsignatura);

          const detalle = detalleRepo.create({ nivel: nivelGuardado, asignatura });
          await detalleRepo.save(detalle);

          asignaturasDelNivel.push(asignatura.nombre);
        }

        resumen.push({ numero: nivelDto.numero, asignaturas: asignaturasDelNivel });
      }

      return { malla: mallaGuardada, niveles: resumen };
    });
  }
}