import {BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { EstadoMatricula, Matricula, TipoMatricula } from './entities/matricula.entity';
import { EstadoMatriculaAsignatura, MatriculaAsignatura } from './entities/matricula-asignatura.entity';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { EstadoSolicitud, SolicitudMatricula } from '../solicitudes-matricula/entities/solicitud-matricula.entity';
import { EstadoVersionMalla } from '../mallas/entities/version-malla.entity';
import { EstadoDocumentoMatricula, TipoDocumentoMatricula, } from 'src/documentos-matricula/entities/documento-matricula.entity';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { PeriodoCarrera } from '../periodo-carrera/entities/periodo-carrera.entity';
import { EstadoPeriodoCarrera } from '../periodo-carrera/entities/periodo-carrera.entity';
import { Paralelo } from '../paralelos/entities/paralelo.entity';
import { AsignaturaParalelo } from '../paralelos/entities/asignatura-paralelo.entity';
import { EstadoPeriodo } from '../periodos/entities/periodo-academico.entity';

@Injectable()
export class MatriculasService {
  constructor(
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,

    @InjectRepository(MatriculaAsignatura)
    private readonly detalleRepository: Repository<MatriculaAsignatura>,

    @InjectRepository(Estudiante)
    private readonly estudianteRepository: Repository<Estudiante>,

    @InjectRepository(PeriodoCarrera)
    private readonly periodoCarreraRepository: Repository<PeriodoCarrera>,

    @InjectRepository(Paralelo)
    private readonly paraleloRepository: Repository<Paralelo>,

    @InjectRepository(AsignaturaParalelo)
    private readonly asignaturaParaleloRepository:
      Repository<AsignaturaParalelo>,

    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateMatriculaDto) {
    return this.dataSource.transaction(async (manager) => {
      const estudianteRepo = manager.getRepository(Estudiante);
      const ofertaRepo = manager.getRepository(PeriodoCarrera);
      const paraleloRepo = manager.getRepository(Paralelo);
      const asignaturaParaleloRepo =
        manager.getRepository(AsignaturaParalelo);
      const matriculaRepo = manager.getRepository(Matricula);
      const detalleRepo = manager.getRepository(MatriculaAsignatura);

      const estudiante = await estudianteRepo.findOne({
        where: { id: dto.estudianteId },
      });

      if (!estudiante) {
        throw new NotFoundException('El estudiante no existe.');
      }

      const oferta = await ofertaRepo.findOne({
        where: { id: dto.periodoCarreraId },
      });

      if (!oferta) {
        throw new NotFoundException(
          'La oferta académica seleccionada no existe.',
        );
      }

      if (oferta.estado !== EstadoPeriodoCarrera.ACTIVA) {
        throw new BadRequestException(
          'La oferta académica seleccionada está inactiva.',
        );
      }

      if (oferta.periodo.estado === EstadoPeriodo.CERRADO) {
        throw new BadRequestException(
          `El periodo "${oferta.periodo.nombre}" está cerrado.`,
        );
      }

      const paralelo = await paraleloRepo.findOne({
        where: { id: dto.paraleloId },
      });

      if (!paralelo) {
        throw new NotFoundException(
          'El paralelo seleccionado no existe.',
        );
      }

      if (paralelo.periodoCarrera.id !== oferta.id) {
        throw new BadRequestException(
          'El paralelo no pertenece a la oferta académica seleccionada.',
        );
      }

      if (
        paralelo.nivel.versionMalla.id !==
        oferta.versionMalla.id
      ) {
        throw new BadRequestException(
          'El nivel del paralelo no pertenece a la versión de malla de la oferta.',
        );
      }

      /*
       * Un estudiante no puede matricularse dos veces en el mismo
       * periodo aunque seleccione ofertas o mallas diferentes.
       */
      const matriculaExistente = await matriculaRepo.findOne({
        where: {
          estudiante: { id: estudiante.id },
          periodo: { id: oferta.periodo.id },
        },
      });

      if (matriculaExistente) {
        throw new ConflictException(
          `El estudiante ya tiene una matrícula registrada en el periodo "${oferta.periodo.nombre}".`,
        );
      }

      const cuposOcupados = await matriculaRepo.count({
        where: {
          paralelo: { id: paralelo.id },
          estado: Not(EstadoMatricula.ANULADA),
        },
      });

      if (cuposOcupados >= paralelo.cupoMaximo) {
        throw new ConflictException(
          `El paralelo "${paralelo.nombre}" ya no tiene cupos disponibles.`,
        );
      }

      const asignaturasDelParalelo =
        await asignaturaParaleloRepo.find({
          where: {
            paralelo: { id: paralelo.id },
          },
        });

      if (asignaturasDelParalelo.length === 0) {
        throw new BadRequestException(
          'El paralelo todavía no tiene asignaturas configuradas.',
        );
      }

      let asignaturasSeleccionadas: AsignaturaParalelo[];

      if (dto.tipo === TipoMatricula.REPETICION) {
        if (
          !dto.asignaturaParaleloIds ||
          dto.asignaturaParaleloIds.length === 0
        ) {
          throw new BadRequestException(
            'Una matrícula de repetición debe contener al menos una materia reprobada.',
          );
        }

        const idsSolicitados = new Set(
          dto.asignaturaParaleloIds,
        );

        asignaturasSeleccionadas =
          asignaturasDelParalelo.filter((asignatura) =>
            idsSolicitados.has(asignatura.id),
          );

        if (
          asignaturasSeleccionadas.length !==
          idsSolicitados.size
        ) {
          throw new BadRequestException(
            'Una o más materias seleccionadas no pertenecen al paralelo.',
          );
        }
      } else {
        /*
         * NUEVA, REGULAR y REINICIO_MALLA matriculan todas las
         * asignaturas configuradas para el paralelo.
         */
        asignaturasSeleccionadas = asignaturasDelParalelo;
      }

      const matricula = matriculaRepo.create({
        estudiante,
        periodo: oferta.periodo,
        periodoCarrera: oferta,
        paralelo,
        versionMalla: oferta.versionMalla,
        nivel: paralelo.nivel,
        tipo: dto.tipo,
        estado: EstadoMatricula.ACTIVA,
      });

      const matriculaGuardada =
        await matriculaRepo.save(matricula);

      const detalles = asignaturasSeleccionadas.map(
        (asignaturaParalelo) =>
          detalleRepo.create({
            matricula: matriculaGuardada,
            asignaturaParalelo,
            esRepeticion:
              dto.tipo === TipoMatricula.REPETICION,
            notaParcial1: null,
            notaParcial2: null,
            notaRecuperacion: null,
            promedioFinal: null,
            estado:
              EstadoMatriculaAsignatura.CURSANDO,
          }),
      );

      await detalleRepo.save(detalles);

      return matriculaRepo.findOne({
        where: { id: matriculaGuardada.id },
        relations: {
          asignaturas: true,
        },
      });
    });
  }

  async obtenerRequisitoDocumento(
  estudianteId: string,
): Promise<TipoDocumentoMatricula> {
  const matriculaAnterior =
  await this.matriculaRepository
    .createQueryBuilder('matricula')
    .leftJoin(
      'matricula.estudiante',
      'estudiante',
    )
    .leftJoinAndSelect(
      'matricula.periodo',
      'periodo',
    )
    .leftJoinAndSelect(
      'matricula.asignaturas',
      'detalle',
    )
    .where(
      'estudiante.id = :estudianteId',
      { estudianteId },
    )
    .andWhere(
      'matricula.estado != :anulada',
      {
        anulada:
          EstadoMatricula.ANULADA,
      },
    )
    .orderBy(
      'periodo.fechaInicio',
      'DESC',
    )
    .getOne();
    
  if (!matriculaAnterior) {
    throw new BadRequestException(
      'Los estudiantes nuevos deben ser matriculados directamente por secretaría.',
    );
  }

  if (
    matriculaAnterior.estado !==
    EstadoMatricula.FINALIZADA
  ) {
    throw new BadRequestException(
      'La matrícula anterior todavía no ha sido finalizada.',
    );
  }

  const tieneMateriasReprobadas =
    matriculaAnterior.asignaturas.some(
      (detalle) =>
        detalle.estado ===
        EstadoMatriculaAsignatura.REPROBADA,
    );

  return tieneMateriasReprobadas
    ? TipoDocumentoMatricula.COMPROBANTE_PAGO
    : TipoDocumentoMatricula.CERTIFICADO_NO_ADEUDAR;
}

  async crearDesdeSolicitud(solicitudId: string) {
  return this.dataSource.transaction(async (manager) => {
    const solicitudRepo =
      manager.getRepository(SolicitudMatricula);

    const matriculaRepo =
      manager.getRepository(Matricula);

    const detalleRepo =
      manager.getRepository(MatriculaAsignatura);

    const asignaturaParaleloRepo =
      manager.getRepository(AsignaturaParalelo);

    const solicitud = await solicitudRepo
  .createQueryBuilder('solicitud')
  .leftJoinAndSelect(
    'solicitud.estudiante',
    'estudiante',
  )
  .leftJoinAndSelect(
    'solicitud.periodoCarrera',
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
    'periodoCarrera.centroEstudio',
    'centroEstudio',
  )
  .leftJoinAndSelect(
    'solicitud.paralelo',
    'paralelo',
  )
  .leftJoinAndSelect(
    'paralelo.nivel',
    'nivel',
  )
  .leftJoinAndSelect(
    'paralelo.periodoCarrera',
    'periodoCarreraParalelo',
  )
  .leftJoinAndSelect(
    'nivel.versionMalla',
    'versionMallaNivel',
  )
  .leftJoinAndSelect(
    'solicitud.matricula',
    'matriculaSolicitud',
  )
  .leftJoinAndSelect(
    'solicitud.documentos',
    'documentos',
  )
  .where(
    'solicitud.id = :solicitudId',
    { solicitudId },
  )
  .getOne();
    if (!solicitud) {
      throw new NotFoundException(
        'La solicitud de matrícula no existe.',
      );
    }

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden aprobar solicitudes pendientes.',
      );
    }

    if (solicitud.matricula) {
      throw new ConflictException(
        'Esta solicitud ya tiene una matrícula oficial asociada.',
      );
    }

    if (
      solicitud.periodoCarrera.estado !==
      EstadoPeriodoCarrera.ACTIVA
    ) {
      throw new BadRequestException(
        'La oferta académica seleccionada ya no está activa.',
      );
    }

    if (
      solicitud.periodoCarrera.periodo.estado ===
      EstadoPeriodo.CERRADO
    ) {
      throw new BadRequestException(
        'No se puede aprobar una solicitud de un periodo cerrado.',
      );
    }

    if (
      solicitud.paralelo.periodoCarrera.id !==
      solicitud.periodoCarrera.id
    ) {
      throw new BadRequestException(
        'El paralelo no pertenece a la oferta académica de la solicitud.',
      );
    }

    const matriculaMismoPeriodo =
      await matriculaRepo.findOne({
        where: {
          estudiante: {
            id: solicitud.estudiante.id,
          },
          periodo: {
            id: solicitud.periodoCarrera.periodo.id,
          },
        },
      });

    if (matriculaMismoPeriodo) {
      throw new ConflictException(
        'El estudiante ya tiene una matrícula en este periodo.',
      );
    }

    /*
     * Se obtiene la última matrícula no anulada.
     * Esta representa el último nivel cursado por el estudiante.
     */
    const matriculaAnterior = await matriculaRepo
      .createQueryBuilder('matricula')
      .leftJoinAndSelect(
        'matricula.estudiante',
        'estudianteAnterior',
      )
      .leftJoinAndSelect(
        'matricula.periodo',
        'periodoAnterior',
      )
      .leftJoinAndSelect(
        'matricula.versionMalla',
        'mallaAnterior',
      )
      .leftJoinAndSelect(
        'matricula.nivel',
        'nivelAnterior',
      )
      .leftJoinAndSelect(
        'matricula.asignaturas',
        'detalleAnterior',
      )
      .leftJoinAndSelect(
        'detalleAnterior.asignaturaParalelo',
        'asignaturaParaleloAnterior',
      )
      .leftJoinAndSelect(
        'asignaturaParaleloAnterior.detalleMalla',
        'detalleMallaAnterior',
      )
      .leftJoinAndSelect(
        'detalleMallaAnterior.asignatura',
        'asignaturaAnterior',
      )
      .where('estudianteAnterior.id = :estudianteId', {
        estudianteId: solicitud.estudiante.id,
      })
      .andWhere('matricula.estado != :estadoAnulada', {
        estadoAnulada: EstadoMatricula.ANULADA,
      })
      .orderBy('periodoAnterior.fechaInicio', 'DESC')
      .getOne();

    /*
     * Los estudiantes nuevos deben ser registrados directamente
     * por secretaría. No pueden ingresar mediante autosolicitud.
     */
    if (!matriculaAnterior) {
      throw new BadRequestException(
        'El estudiante no tiene una matrícula anterior. Los estudiantes nuevos deben ser matriculados directamente por secretaría.',
      );
    }

    if (
      matriculaAnterior.estado !==
      EstadoMatricula.FINALIZADA
    ) {
      throw new BadRequestException(
        'La matrícula anterior todavía no ha sido finalizada. No se puede aprobar una nueva matrícula.',
      );
    }

    const materiasReprobadas =
      matriculaAnterior.asignaturas.filter(
        (detalle) =>
          detalle.estado ===
          EstadoMatriculaAsignatura.REPROBADA,
      );

      const tipoRespaldoRequerido =
  materiasReprobadas.length > 0
    ? TipoDocumentoMatricula.COMPROBANTE_PAGO
    : TipoDocumentoMatricula.CERTIFICADO_NO_ADEUDAR;

const tiposRequeridos = [
  TipoDocumentoMatricula.CEDULA,
  tipoRespaldoRequerido,
];

for (const tipo of tiposRequeridos) {
  const documento =
    solicitud.documentos.find(
      (item) => item.tipo === tipo,
    );

  if (!documento) {
    throw new BadRequestException(
      `La solicitud no contiene el documento requerido: ${tipo}.`,
    );
  }

  if (
    documento.estado !==
    EstadoDocumentoMatricula.APROBADO
  ) {
    throw new BadRequestException(
      `El documento ${tipo} todavía no ha sido aprobado.`,
    );
  }
}

    const materiasActuales =
      await asignaturaParaleloRepo
        .createQueryBuilder('asignaturaParalelo')

        .leftJoinAndSelect(
          'asignaturaParalelo.paralelo',
          'paraleloActual',
        )
        .leftJoinAndSelect(
          'asignaturaParalelo.detalleMalla',
          'detalleMallaActual',
        )
        .leftJoinAndSelect(
          'detalleMallaActual.asignatura',
          'asignaturaActual',
        )
        .leftJoinAndSelect(
          'asignaturaParalelo.docente',
          'docenteActual',
        )
        .where('paraleloActual.id = :paraleloId', {
          paraleloId: solicitud.paralelo.id,
        })
        .getMany();

    if (materiasActuales.length === 0) {
      throw new BadRequestException(
        'El paralelo todavía no tiene materias configuradas.',
      );
    }

    const conservaMismaMalla =
      matriculaAnterior.versionMalla.id ===
      solicitud.periodoCarrera.versionMalla.id;

    let tipoMatricula: TipoMatricula;
    let materiasSeleccionadas: AsignaturaParalelo[];

    /*
     * CASO 1:
     * Perdió materias y su malla todavía continúa.
     * Repite el mismo nivel, pero solo las materias perdidas.
     */
    if (
      materiasReprobadas.length > 0 &&
      conservaMismaMalla
    ) {
      if (
        solicitud.paralelo.nivel.id !==
        matriculaAnterior.nivel.id
      ) {
        throw new BadRequestException(
          `El estudiante debe repetir el nivel "${matriculaAnterior.nivel.nombre}" porque tiene materias reprobadas.`,
        );
      }

      const asignaturasReprobadasIds = new Set(
        materiasReprobadas.map(
          (detalle) =>
            detalle.asignaturaParalelo.detalleMalla
              .asignatura.id,
        ),
      );

      materiasSeleccionadas = materiasActuales.filter(
        (asignaturaParalelo) =>
          asignaturasReprobadasIds.has(
            asignaturaParalelo.detalleMalla.asignatura.id,
          ),
      );

      if (
        materiasSeleccionadas.length !==
        asignaturasReprobadasIds.size
      ) {
        throw new BadRequestException(
          'El nuevo paralelo no contiene todas las materias que el estudiante debe repetir.',
        );
      }

      tipoMatricula = TipoMatricula.REPETICION;
    }

    /*
     * CASO 2:
     * Perdió materias, pero la malla anterior ya cambió.
     * Debe reiniciar desde primer nivel con la malla activa.
     */
    else if (
      materiasReprobadas.length > 0 &&
      !conservaMismaMalla
    ) {
      if (solicitud.paralelo.nivel.numero !== 1) {
        throw new BadRequestException(
          'La malla anterior cambió. El estudiante debe matricularse desde primer nivel.',
        );
      }

      if (
        solicitud.periodoCarrera.versionMalla.estado !==
        EstadoVersionMalla.ACTIVA
      ) {
        throw new BadRequestException(
          'Para reiniciar desde primer nivel debe seleccionarse la malla activa.',
        );
      }

      tipoMatricula = TipoMatricula.REINICIO_MALLA;
      materiasSeleccionadas = materiasActuales;
    }

    /*
     * CASO 3:
     * Aprobó todas las materias.
     * Continúa al siguiente nivel de la misma malla.
     */
    else {
      if (!conservaMismaMalla) {
        throw new BadRequestException(
          'El estudiante aprobó el nivel y debe continuar con la misma versión de malla de su cohorte.',
        );
      }

      const siguienteNivel =
        matriculaAnterior.nivel.numero + 1;

      if (
        solicitud.paralelo.nivel.numero !==
        siguienteNivel
      ) {
        throw new BadRequestException(
          `El estudiante debe matricularse en el nivel ${siguienteNivel}.`,
        );
      }

      tipoMatricula = TipoMatricula.REGULAR;
      materiasSeleccionadas = materiasActuales;
    }

    const cuposOcupados = await matriculaRepo.count({
      where: {
        paralelo: {
          id: solicitud.paralelo.id,
        },
        estado: Not(EstadoMatricula.ANULADA),
      },
    });

    if (
      cuposOcupados >= solicitud.paralelo.cupoMaximo
    ) {
      throw new ConflictException(
        `El paralelo "${solicitud.paralelo.nombre}" ya no tiene cupos disponibles.`,
      );
    }

    const nuevaMatricula = matriculaRepo.create({
      estudiante: solicitud.estudiante,
      periodo: solicitud.periodoCarrera.periodo,
      periodoCarrera: solicitud.periodoCarrera,
      paralelo: solicitud.paralelo,
      versionMalla:
        solicitud.periodoCarrera.versionMalla,
      nivel: solicitud.paralelo.nivel,
      tipo: tipoMatricula,
      estado: EstadoMatricula.ACTIVA,
    });

    const matriculaGuardada =
      await matriculaRepo.save(nuevaMatricula);

    const detalles = materiasSeleccionadas.map(
      (asignaturaParalelo) =>
        detalleRepo.create({
          matricula: matriculaGuardada,
          asignaturaParalelo,
          esRepeticion:
            tipoMatricula ===
            TipoMatricula.REPETICION,
          notaParcial1: null,
          notaParcial2: null,
          notaRecuperacion: null,
          promedioFinal: null,
          estado:
            EstadoMatriculaAsignatura.CURSANDO,
        }),
    );

    await detalleRepo.save(detalles);

    solicitud.estado = EstadoSolicitud.APROBADA;
    solicitud.matricula = matriculaGuardada;
    solicitud.puedeReenviar = false;
    solicitud.motivoRechazo = undefined;

    await solicitudRepo.save(solicitud);

    return {
      message:
        'Solicitud aprobada y matrícula creada correctamente.',
      solicitud,
      matricula: await matriculaRepo.findOne({
        where: {
          id: matriculaGuardada.id,
        },
        relations: {
          asignaturas: true,
        },
      }),
    };
  });
}

  findAll(filtros?: {
    estudianteId?: string;
    periodoId?: string;
    carreraId?: string;
    paraleloId?: string;
    estado?: EstadoMatricula;
  }) {
    const query = this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.estudiante', 'estudiante')
      .leftJoinAndSelect('matricula.periodo', 'periodo')
      .leftJoinAndSelect(
        'matricula.periodoCarrera',
        'periodoCarrera',
      )
      .leftJoinAndSelect(
        'periodoCarrera.carrera',
        'carrera',
      )
      .leftJoinAndSelect(
        'matricula.versionMalla',
        'versionMalla',
      )
      .leftJoinAndSelect('matricula.nivel', 'nivel')
      .leftJoinAndSelect('matricula.paralelo', 'paralelo')
      .leftJoinAndSelect(
        'matricula.asignaturas',
        'matriculaAsignatura',
      )
      .leftJoinAndSelect(
        'matriculaAsignatura.asignaturaParalelo',
        'asignaturaParalelo',
      )
      .leftJoinAndSelect(
        'asignaturaParalelo.detalleMalla',
        'detalleMalla',
      )
      .leftJoinAndSelect(
        'detalleMalla.asignatura',
        'asignatura',
      )
      .leftJoinAndSelect(
        'asignaturaParalelo.docente',
        'docente',
      );

    if (filtros?.estudianteId) {
      query.andWhere('estudiante.id = :estudianteId', {
        estudianteId: filtros.estudianteId,
      });
    }

    if (filtros?.periodoId) {
      query.andWhere('periodo.id = :periodoId', {
        periodoId: filtros.periodoId,
      });
    }

    if (filtros?.carreraId) {
      query.andWhere('carrera.id = :carreraId', {
        carreraId: filtros.carreraId,
      });
    }

    if (filtros?.paraleloId) {
      query.andWhere('paralelo.id = :paraleloId', {
        paraleloId: filtros.paraleloId,
      });
    }

    if (filtros?.estado) {
      query.andWhere('matricula.estado = :estado', {
        estado: filtros.estado,
      });
    }

    return query
      .orderBy('periodo.fechaInicio', 'DESC')
      .addOrderBy('estudiante.apellidos', 'ASC')
      .addOrderBy('estudiante.nombres', 'ASC')
      .getMany();
  }

  async findOne(id: string) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id },
      relations: {
        asignaturas: true,
      },
    });

    if (!matricula) {
      throw new NotFoundException(
        `La matrícula con ID ${id} no fue encontrada.`,
      );
    }

    return matricula;
  }

  async misMatriculas(usuarioId: string) {
    return this.matriculaRepository
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.estudiante', 'estudiante')
      .leftJoinAndSelect('estudiante.usuario', 'usuario')
      .leftJoinAndSelect('matricula.periodo', 'periodo')
      .leftJoinAndSelect(
        'matricula.periodoCarrera',
        'periodoCarrera',
      )
      .leftJoinAndSelect(
        'periodoCarrera.carrera',
        'carrera',
      )
      .leftJoinAndSelect(
        'matricula.versionMalla',
        'versionMalla',
      )
      .leftJoinAndSelect('matricula.nivel', 'nivel')
      .leftJoinAndSelect('matricula.paralelo', 'paralelo')
      .leftJoinAndSelect(
        'matricula.asignaturas',
        'matriculaAsignatura',
      )
      .leftJoinAndSelect(
        'matriculaAsignatura.asignaturaParalelo',
        'asignaturaParalelo',
      )
      .leftJoinAndSelect(
        'asignaturaParalelo.detalleMalla',
        'detalleMalla',
      )
      .leftJoinAndSelect(
        'detalleMalla.asignatura',
        'asignatura',
      )
      .leftJoinAndSelect(
        'asignaturaParalelo.docente',
        'docente',
      )
      .where('usuario.id = :usuarioId', { usuarioId })
      .orderBy('periodo.fechaInicio', 'DESC')
      .getMany();
  }

  async anular(id: string) {
    const matricula = await this.findOne(id);

    if (matricula.estado === EstadoMatricula.FINALIZADA) {
      throw new BadRequestException(
        'No se puede anular una matrícula académica finalizada.',
      );
    }

    if (matricula.estado === EstadoMatricula.ANULADA) {
      throw new BadRequestException(
        'La matrícula ya se encuentra anulada.',
      );
    }

    matricula.estado = EstadoMatricula.ANULADA;

    await this.matriculaRepository.save(matricula);

    return {
      message: 'Matrícula anulada correctamente.',
    };
  }
}