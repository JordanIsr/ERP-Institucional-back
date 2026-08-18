import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { DataSource, EntityManager, Repository } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';

import {
  EstadoMatriculaAsignatura,
  MatriculaAsignatura,
} from '../matriculas/entities/matricula-asignatura.entity';

import {
  EstadoMatricula,
  Matricula,
} from '../matriculas/entities/matricula.entity';

import { AsignaturaParalelo } from '../paralelos/entities/asignatura-paralelo.entity';
import { Docente } from '../docentes/entities/docente.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../auth/roles';

import { CorreccionCalificacion } from './entities/correccion-calificacion.entity';
import { RegistrarNotaDto } from './dto/registrar-nota.dto';
import { CorregirNotaDto } from './dto/corregir-nota.dto';
import { TipoNota } from './tipo-nota.enum';

@Injectable()
export class CalificacionesService {
  constructor(
    @InjectRepository(MatriculaAsignatura)
    private readonly detalleRepository:
      Repository<MatriculaAsignatura>,

    @InjectRepository(AsignaturaParalelo)
    private readonly asignaturaParaleloRepository:
      Repository<AsignaturaParalelo>,

    @InjectRepository(Docente)
    private readonly docenteRepository: Repository<Docente>,

    @InjectRepository(CorreccionCalificacion)
    private readonly correccionRepository:
      Repository<CorreccionCalificacion>,

    private readonly dataSource: DataSource,
  ) {}

  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private obtenerValor(
    detalle: MatriculaAsignatura,
    tipoNota: TipoNota,
  ): number | null {
    switch (tipoNota) {
      case TipoNota.PARCIAL_1:
        return detalle.notaParcial1;

      case TipoNota.PARCIAL_2:
        return detalle.notaParcial2;

      case TipoNota.RECUPERACION:
        return detalle.notaRecuperacion;
    }
  }

  private asignarValor(
    detalle: MatriculaAsignatura,
    tipoNota: TipoNota,
    nota: number,
  ): void {
    switch (tipoNota) {
      case TipoNota.PARCIAL_1:
        detalle.notaParcial1 = nota;
        break;

      case TipoNota.PARCIAL_2:
        detalle.notaParcial2 = nota;
        break;

      case TipoNota.RECUPERACION:
        detalle.notaRecuperacion = nota;
        break;
    }
  }

  private recalcular(
    detalle: MatriculaAsignatura,
  ): void {
    const parcial1 = detalle.notaParcial1;
    const parcial2 = detalle.notaParcial2;
    const recuperacion = detalle.notaRecuperacion;

    if (parcial1 === null || parcial2 === null) {
      detalle.promedioFinal = null;
      detalle.estado =
        EstadoMatriculaAsignatura.CURSANDO;
      return;
    }

    const promedioNormal = this.redondear(
      (Number(parcial1) + Number(parcial2)) / 2,
    );

    if (promedioNormal >= 7) {
      detalle.promedioFinal = promedioNormal;
      detalle.estado =
        EstadoMatriculaAsignatura.APROBADA;
      return;
    }

    /*
     * Si todavía no existe recuperación, la materia continúa
     * abierta y la matrícula no puede finalizar.
     */
    if (recuperacion === null) {
      detalle.promedioFinal = promedioNormal;
      detalle.estado =
        EstadoMatriculaAsignatura.CURSANDO;
      return;
    }

    const notaMayor = Math.max(
      Number(parcial1),
      Number(parcial2),
    );

    const notaMenor = Math.min(
      Number(parcial1),
      Number(parcial2),
    );

    const promedioConRecuperacion =
      Number(recuperacion) > notaMenor
        ? this.redondear(
            (notaMayor + Number(recuperacion)) / 2,
          )
        : promedioNormal;

    detalle.promedioFinal =
      promedioConRecuperacion;

    detalle.estado =
      promedioConRecuperacion >= 7
        ? EstadoMatriculaAsignatura.APROBADA
        : EstadoMatriculaAsignatura.REPROBADA;
  }

  private async actualizarEstadoMatricula(
    manager: EntityManager,
    matriculaId: string,
  ): Promise<void> {
    const matriculaRepository =
      manager.getRepository(Matricula);

    const detalleRepository =
      manager.getRepository(MatriculaAsignatura);

    const matricula =
      await matriculaRepository.findOne({
        where: { id: matriculaId },
      });

    if (!matricula) {
      throw new NotFoundException(
        'La matrícula relacionada no existe.',
      );
    }

    if (
      matricula.estado === EstadoMatricula.ANULADA
    ) {
      return;
    }

    const materiasPendientes =
      await detalleRepository.count({
        where: {
          matricula: { id: matricula.id },
          estado:
            EstadoMatriculaAsignatura.CURSANDO,
        },
      });

    matricula.estado =
      materiasPendientes === 0
        ? EstadoMatricula.FINALIZADA
        : EstadoMatricula.ACTIVA;

    await matriculaRepository.save(matricula);
  }

  private async buscarDetalleCompleto(
    manager: EntityManager,
    detalleId: string,
  ) {
    return manager
      .getRepository(MatriculaAsignatura)
      .createQueryBuilder('detalle')
      .leftJoinAndSelect(
        'detalle.matricula',
        'matricula',
      )
      .leftJoinAndSelect(
        'matricula.estudiante',
        'estudiante',
      )
      .leftJoinAndSelect(
        'detalle.asignaturaParalelo',
        'asignaturaParalelo',
      )
      .leftJoinAndSelect(
        'asignaturaParalelo.docente',
        'docente',
      )
      .leftJoinAndSelect(
        'docente.usuario',
        'docenteUsuario',
      )
      .leftJoinAndSelect(
        'asignaturaParalelo.detalleMalla',
        'detalleMalla',
      )
      .leftJoinAndSelect(
        'detalleMalla.asignatura',
        'asignatura',
      )
      .where('detalle.id = :detalleId', {
        detalleId,
      })
      .getOne();
  }

  async misAsignaturas(usuarioId: string) {
    const docente =
      await this.docenteRepository.findOne({
        where: {
          usuario: {
            id: usuarioId,
          },
        },
      });

    if (!docente) {
      throw new NotFoundException(
        'No existe una ficha de docente vinculada con tu usuario.',
      );
    }

    return this.asignaturaParaleloRepository
      .createQueryBuilder('asignaturaParalelo')
      .leftJoinAndSelect(
        'asignaturaParalelo.docente',
        'docente',
      )
      .leftJoinAndSelect(
        'asignaturaParalelo.paralelo',
        'paralelo',
      )
      .leftJoinAndSelect(
        'paralelo.periodoCarrera',
        'periodoCarrera',
      )
      .leftJoinAndSelect(
        'periodoCarrera.periodo',
        'periodo',
      )
      .leftJoinAndSelect(
        'periodoCarrera.carrera',
        'carrera',
      )
      .leftJoinAndSelect(
        'periodoCarrera.versionMalla',
        'versionMalla',
      )
      .leftJoinAndSelect(
        'paralelo.nivel',
        'nivel',
      )
      .leftJoinAndSelect(
        'asignaturaParalelo.detalleMalla',
        'detalleMalla',
      )
      .leftJoinAndSelect(
        'detalleMalla.asignatura',
        'asignatura',
      )
      .where('docente.id = :docenteId', {
        docenteId: docente.id,
      })
      .orderBy('periodo.fechaInicio', 'DESC')
      .addOrderBy('carrera.nombre', 'ASC')
      .addOrderBy('nivel.numero', 'ASC')
      .addOrderBy('asignatura.nombre', 'ASC')
      .getMany();
  }

  async estudiantesPorAsignatura(
    asignaturaParaleloId: string,
    usuarioId: string,
    rol: UserRole,
  ) {
    if (rol === UserRole.DOCENTE) {
      const asignacion =
        await this.asignaturaParaleloRepository
          .createQueryBuilder('asignacion')
          .leftJoinAndSelect(
            'asignacion.docente',
            'docente',
          )
          .leftJoinAndSelect(
            'docente.usuario',
            'usuario',
          )
          .where('asignacion.id = :id', {
            id: asignaturaParaleloId,
          })
          .getOne();

      if (!asignacion) {
        throw new NotFoundException(
          'La asignación académica no existe.',
        );
      }

      if (asignacion.docente.usuario?.id !== usuarioId) {
        throw new ForbiddenException(
          'No puedes consultar estudiantes de una asignatura que no tienes asignada.',
        );
      }
    }

    return this.detalleRepository
      .createQueryBuilder('detalle')
      .leftJoinAndSelect(
        'detalle.matricula',
        'matricula',
      )
      .leftJoinAndSelect(
        'matricula.estudiante',
        'estudiante',
      )
      .leftJoinAndSelect(
        'matricula.periodo',
        'periodo',
      )
      .leftJoinAndSelect(
        'matricula.paralelo',
        'paralelo',
      )
      .leftJoinAndSelect(
        'detalle.asignaturaParalelo',
        'asignaturaParalelo',
      )
      .where(
        'asignaturaParalelo.id = :asignaturaParaleloId',
        { asignaturaParaleloId },
      )
      .andWhere('matricula.estado != :anulada', {
        anulada: EstadoMatricula.ANULADA,
      })
      .orderBy('estudiante.apellidos', 'ASC')
      .addOrderBy('estudiante.nombres', 'ASC')
      .getMany();
  }

  async registrarNotaDocente(
    detalleId: string,
    usuarioId: string,
    dto: RegistrarNotaDto,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const detalle =
          await this.buscarDetalleCompleto(
            manager,
            detalleId,
          );

        if (!detalle) {
          throw new NotFoundException(
            'La materia matriculada no existe.',
          );
        }

        if (
          detalle.asignaturaParalelo.docente.usuario
            ?.id !== usuarioId
        ) {
          throw new ForbiddenException(
            'No puedes registrar notas en una asignatura que no tienes asignada.',
          );
        }

        if (
          detalle.matricula.estado !==
          EstadoMatricula.ACTIVA
        ) {
          throw new BadRequestException(
            'La matrícula no está activa.',
          );
        }

        const valorActual = this.obtenerValor(
          detalle,
          dto.tipoNota,
        );

        if (valorActual !== null) {
          throw new ConflictException(
            'Esta nota ya fue registrada. Solo secretaría puede corregirla.',
          );
        }

        if (
          dto.tipoNota === TipoNota.RECUPERACION
        ) {
          if (
            detalle.notaParcial1 === null ||
            detalle.notaParcial2 === null
          ) {
            throw new BadRequestException(
              'Primero deben registrarse los dos parciales.',
            );
          }

          const promedioNormal =
            (Number(detalle.notaParcial1) +
              Number(detalle.notaParcial2)) /
            2;

          if (promedioNormal >= 7) {
            throw new BadRequestException(
              'El estudiante ya aprobó la materia y no necesita recuperación.',
            );
          }
        }

        this.asignarValor(
          detalle,
          dto.tipoNota,
          dto.nota,
        );

        this.recalcular(detalle);

        await manager
          .getRepository(MatriculaAsignatura)
          .save(detalle);

        await this.actualizarEstadoMatricula(
          manager,
          detalle.matricula.id,
        );

        return detalle;
      },
    );
  }

  async corregirNota(
    detalleId: string,
    usuarioId: string,
    dto: CorregirNotaDto,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const detalle =
          await this.buscarDetalleCompleto(
            manager,
            detalleId,
          );

        if (!detalle) {
          throw new NotFoundException(
            'La materia matriculada no existe.',
          );
        }

        if (
          detalle.matricula.estado ===
          EstadoMatricula.ANULADA
        ) {
          throw new BadRequestException(
            'No se puede corregir una matrícula anulada.',
          );
        }

        if (
          dto.tipoNota === TipoNota.RECUPERACION &&
          (detalle.notaParcial1 === null ||
            detalle.notaParcial2 === null)
        ) {
          throw new BadRequestException(
            'No se puede registrar recuperación sin los dos parciales.',
          );
        }

        const valorAnterior = this.obtenerValor(
          detalle,
          dto.tipoNota,
        );

        if (
          valorAnterior !== null &&
          Number(valorAnterior) === Number(dto.nota)
        ) {
          throw new BadRequestException(
            'La nueva nota es igual a la nota registrada.',
          );
        }

        const usuario = await manager
          .getRepository(User)
          .findOne({
            where: { id: usuarioId },
          });

        if (!usuario) {
          throw new NotFoundException(
            'El usuario que realiza la corrección no existe.',
          );
        }

        this.asignarValor(
          detalle,
          dto.tipoNota,
          dto.nota,
        );

        this.recalcular(detalle);

        await manager
          .getRepository(MatriculaAsignatura)
          .save(detalle);

        const correccion = manager
          .getRepository(CorreccionCalificacion)
          .create({
            matriculaAsignatura: detalle,
            corregidoPor: usuario,
            tipoNota: dto.tipoNota,
            valorAnterior,
            valorNuevo: dto.nota,
            motivo: dto.motivo.trim(),
          });

        await manager
          .getRepository(CorreccionCalificacion)
          .save(correccion);

        await this.actualizarEstadoMatricula(
          manager,
          detalle.matricula.id,
        );

        return {
          message: 'Nota corregida correctamente.',
          detalle,
          correccion,
        };
      },
    );
  }

  historialCorrecciones(detalleId: string) {
    return this.correccionRepository.find({
      where: {
        matriculaAsignatura: {
          id: detalleId,
        },
      },
      order: {
        fechaCorreccion: 'DESC',
      },
    });
  }
}