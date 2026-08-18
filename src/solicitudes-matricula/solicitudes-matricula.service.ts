import {BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EstadoSolicitud, SolicitudMatricula } from './entities/solicitud-matricula.entity';
import { CreateSolicitudMatriculaDto } from './dto/create-solicitud-matricula.dto';
import { EstudiantesService } from '../estudiantes/estudiantes.service';
import { PeriodoCarreraService } from '../periodo-carrera/periodo-carrera.service';
import { ParaleloService } from '../paralelos/paralelo.service';
import { MatriculasService } from '../matriculas/matriculas.service';

import { DocumentoMatricula, EstadoDocumentoMatricula, TipoDocumentoMatricula } from '../documentos-matricula/entities/documento-matricula.entity';

interface ArchivosSolicitudUrls {
  cedulaUrl?: string;
  certificadoNoAdeudarUrl?: string;
  comprobantePagoUrl?: string;
}

@Injectable()
export class SolicitudesMatriculaService {
  constructor(
    @InjectRepository(SolicitudMatricula)
    private readonly repo:
      Repository<SolicitudMatricula>,

    private readonly estudiantesService:
      EstudiantesService,

    private readonly periodoCarreraService:
      PeriodoCarreraService,

    private readonly paraleloService:
      ParaleloService,

    private readonly matriculasService:
      MatriculasService,

    private readonly dataSource: DataSource,
  ) {}

  private async getEstudianteDelUsuario(
    usuarioId: string,
  ) {
    const estudiante =
      await this.estudiantesService
        .findByUsuarioId(usuarioId);

    if (!estudiante) {
      throw new NotFoundException(
        'No existe una ficha de estudiante vinculada con tu cuenta.',
      );
    }

    return estudiante;
  }

  private contarCuposAprobados(
    paraleloId: string,
  ) {
    return this.repo.count({
      where: {
        paralelo: {
          id: paraleloId,
        },
        estado: EstadoSolicitud.APROBADA,
      },
    });
  }

  async crear(
    usuarioId: string,
    dto: CreateSolicitudMatriculaDto,
    archivos: ArchivosSolicitudUrls,
  ) {
    const estudiante =
      await this.getEstudianteDelUsuario(
        usuarioId,
      );

    const periodoCarrera =
      await this.periodoCarreraService.findOne(
        dto.periodoCarreraId,
      );

    const paralelo =
      await this.paraleloService.findOne(
        dto.paraleloId,
      );

    if (
      paralelo.periodoCarrera.id !==
      periodoCarrera.id
    ) {
      throw new BadRequestException(
        'El paralelo no pertenece a la oferta académica seleccionada.',
      );
    }

    /*
     * No se permite tener dos solicitudes en el mismo periodo
     * académico aunque correspondan a ofertas diferentes.
     */
    const solicitudExistente = await this.repo
      .createQueryBuilder('solicitud')
      .leftJoin(
        'solicitud.estudiante',
        'estudiante',
      )
      .leftJoin(
        'solicitud.periodoCarrera',
        'periodoCarrera',
      )
      .leftJoin(
        'periodoCarrera.periodo',
        'periodo',
      )
      .where(
        'estudiante.id = :estudianteId',
        {
          estudianteId: estudiante.id,
        },
      )
      .andWhere(
        'periodo.id = :periodoId',
        {
          periodoId:
            periodoCarrera.periodo.id,
        },
      )
      .getOne();

    if (solicitudExistente) {
      throw new ConflictException(
        `Ya tienes una solicitud registrada para el periodo "${periodoCarrera.periodo.nombre}".`,
      );
    }

    const requisito =
      await this.matriculasService
        .obtenerRequisitoDocumento(
          estudiante.id,
        );

    if (!archivos.cedulaUrl) {
      throw new BadRequestException(
        'La copia de cédula es obligatoria.',
      );
    }

    if (
      requisito ===
        TipoDocumentoMatricula.CERTIFICADO_NO_ADEUDAR &&
      !archivos.certificadoNoAdeudarUrl
    ) {
      throw new BadRequestException(
        'Como aprobaste todas las materias, debes presentar el certificado de no adeudar.',
      );
    }

    if (
      requisito ===
        TipoDocumentoMatricula.COMPROBANTE_PAGO &&
      !archivos.comprobantePagoUrl
    ) {
      throw new BadRequestException(
        'Como tienes materias reprobadas, debes presentar el comprobante de pago.',
      );
    }

    if (
      requisito ===
        TipoDocumentoMatricula.CERTIFICADO_NO_ADEUDAR &&
      archivos.comprobantePagoUrl
    ) {
      throw new BadRequestException(
        'Debes presentar el certificado de no adeudar, no un comprobante de pago.',
      );
    }

    if (
      requisito ===
        TipoDocumentoMatricula.COMPROBANTE_PAGO &&
      archivos.certificadoNoAdeudarUrl
    ) {
      throw new BadRequestException(
        'Debes presentar el comprobante de pago por las materias reprobadas.',
      );
    }

    const ocupados =
      await this.contarCuposAprobados(
        paralelo.id,
      );

    if (ocupados >= paralelo.cupoMaximo) {
      throw new ConflictException(
        `El paralelo "${paralelo.nombre}" ya no tiene cupos disponibles.`,
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        const solicitudRepository =
          manager.getRepository(
            SolicitudMatricula,
          );

        const documentoRepository =
          manager.getRepository(
            DocumentoMatricula,
          );

        const nuevaSolicitud =
          solicitudRepository.create({
            estudiante,
            periodoCarrera,
            paralelo,
            estado:
              EstadoSolicitud.PENDIENTE,
            puedeReenviar: false,
          });

        const solicitudGuardada =
          await solicitudRepository.save(
            nuevaSolicitud,
          );

        const documentos:
          DocumentoMatricula[] = [
            documentoRepository.create({
              solicitud: solicitudGuardada,
              tipo:
                TipoDocumentoMatricula.CEDULA,
              archivoUrl:
                archivos.cedulaUrl,
              estado:
                EstadoDocumentoMatricula.PENDIENTE,
            }),
          ];

        if (
          requisito ===
          TipoDocumentoMatricula
            .CERTIFICADO_NO_ADEUDAR
        ) {
          documentos.push(
            documentoRepository.create({
              solicitud: solicitudGuardada,
              tipo:
                TipoDocumentoMatricula
                  .CERTIFICADO_NO_ADEUDAR,
              archivoUrl:
                archivos
                  .certificadoNoAdeudarUrl!,
              estado:
                EstadoDocumentoMatricula
                  .PENDIENTE,
            }),
          );
        } else {
          documentos.push(
            documentoRepository.create({
              solicitud: solicitudGuardada,
              tipo:
                TipoDocumentoMatricula
                  .COMPROBANTE_PAGO,
              archivoUrl:
                archivos.comprobantePagoUrl!,
              estado:
                EstadoDocumentoMatricula
                  .PENDIENTE,
            }),
          );
        }

        await documentoRepository.save(
          documentos,
        );

        return solicitudRepository.findOne({
          where: {
            id: solicitudGuardada.id,
          },
          relations: {
            documentos: true,
          },
        });
      },
    );
  }

  async reenviar(
    usuarioId: string,
    solicitudId: string,
    archivos: ArchivosSolicitudUrls,
  ) {
    const estudiante =
      await this.getEstudianteDelUsuario(
        usuarioId,
      );

    return this.dataSource.transaction(
      async (manager) => {
        const solicitudRepository =
          manager.getRepository(
            SolicitudMatricula,
          );

        const documentoRepository =
          manager.getRepository(
            DocumentoMatricula,
          );

        const solicitud =
          await solicitudRepository.findOne({
            where: {
              id: solicitudId,
            },
            relations: {
              estudiante: true,
              documentos: true,
            },
          });

        if (!solicitud) {
          throw new NotFoundException(
            'Solicitud no encontrada.',
          );
        }

        if (
          solicitud.estudiante.id !==
          estudiante.id
        ) {
          throw new ForbiddenException(
            'No puedes modificar la solicitud de otro estudiante.',
          );
        }

        if (
          solicitud.estado !==
            EstadoSolicitud.RECHAZADA ||
          !solicitud.puedeReenviar
        ) {
          throw new BadRequestException(
            'La solicitud no está disponible para reenvío.',
          );
        }

        const urlsPorTipo = new Map<
          TipoDocumentoMatricula,
          string | undefined
        >([
          [
            TipoDocumentoMatricula.CEDULA,
            archivos.cedulaUrl,
          ],
          [
            TipoDocumentoMatricula
              .CERTIFICADO_NO_ADEUDAR,
            archivos
              .certificadoNoAdeudarUrl,
          ],
          [
            TipoDocumentoMatricula
              .COMPROBANTE_PAGO,
            archivos.comprobantePagoUrl,
          ],
        ]);

        const documentosRechazados =
          solicitud.documentos.filter(
            (documento) =>
              documento.estado ===
              EstadoDocumentoMatricula
                .RECHAZADO,
          );

        if (
          documentosRechazados.length === 0
        ) {
          throw new BadRequestException(
            'La solicitud no tiene documentos rechazados.',
          );
        }

        for (
          const documento of
          documentosRechazados
        ) {
          const nuevaUrl =
            urlsPorTipo.get(documento.tipo);

          if (!nuevaUrl) {
            throw new BadRequestException(
              `Debes volver a subir el documento rechazado: ${documento.tipo}.`,
            );
          }

          documento.archivoUrl = nuevaUrl;
          documento.estado =
            EstadoDocumentoMatricula.PENDIENTE;

          documento.motivoRechazo = null;
          documento.revisadoPor = null;
          documento.fechaRevision = null;

          await documentoRepository.save(
            documento,
          );
        }

        solicitud.estado =
          EstadoSolicitud.PENDIENTE;

        solicitud.motivoRechazo =
          undefined;

        solicitud.puedeReenviar = false;

        await solicitudRepository.save(
          solicitud,
        );

        return solicitudRepository.findOne({
          where: {
            id: solicitud.id,
          },
          relations: {
            documentos: true,
          },
        });
      },
    );
  }

  async misSolicitudes(
    usuarioId: string,
  ) {
    const estudiante =
      await this.getEstudianteDelUsuario(
        usuarioId,
      );

    return this.repo.find({
      where: {
        estudiante: {
          id: estudiante.id,
        },
      },
      relations: {
        documentos: true,
        matricula: true,
      },
      order: {
        fechaEnvio: 'DESC',
      },
    });
  }

  async miMatriculaVigente(
    usuarioId: string,
  ) {
    const estudiante =
      await this.getEstudianteDelUsuario(
        usuarioId,
      );

    const solicitud =
      await this.repo.findOne({
        where: {
          estudiante: {
            id: estudiante.id,
          },
          estado:
            EstadoSolicitud.APROBADA,
        },
        relations: {
          documentos: true,
          matricula: true,
        },
        order: {
          fechaEnvio: 'DESC',
        },
      });

    if (!solicitud) {
      throw new NotFoundException(
        'Todavía no tienes una matrícula aprobada.',
      );
    }

    return solicitud;
  }

  async findAll(filtros?: {
    periodoCarreraId?: string;
    carreraId?: string;
    periodoId?: string;
    paraleloId?: string;
    estado?: EstadoSolicitud;
    busqueda?: string;
  }) {
    const query = this.repo
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
        'periodoCarrera.centroEstudio',
        'centroEstudio',
      )
      .leftJoinAndSelect(
        'periodoCarrera.versionMalla',
        'versionMalla',
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
        'solicitud.documentos',
        'documentos',
      )
      .leftJoinAndSelect(
        'solicitud.matricula',
        'matricula',
      )
      .orderBy(
        'solicitud.fechaEnvio',
        'DESC',
      );

    if (filtros?.periodoCarreraId) {
      query.andWhere(
        'periodoCarrera.id = :periodoCarreraId',
        {
          periodoCarreraId:
            filtros.periodoCarreraId,
        },
      );
    }

    if (filtros?.carreraId) {
      query.andWhere(
        'carrera.id = :carreraId',
        {
          carreraId:
            filtros.carreraId,
        },
      );
    }

    if (filtros?.periodoId) {
      query.andWhere(
        'periodo.id = :periodoId',
        {
          periodoId: filtros.periodoId,
        },
      );
    }

    if (filtros?.paraleloId) {
      query.andWhere(
        'paralelo.id = :paraleloId',
        {
          paraleloId:
            filtros.paraleloId,
        },
      );
    }

    if (filtros?.estado) {
      query.andWhere(
        'solicitud.estado = :estado',
        {
          estado: filtros.estado,
        },
      );
    }

    if (filtros?.busqueda) {
      query.andWhere(
        `(
          estudiante.cedula ILIKE :busqueda
          OR estudiante.nombres ILIKE :busqueda
          OR estudiante.apellidos ILIKE :busqueda
        )`,
        {
          busqueda:
            `%${filtros.busqueda}%`,
        },
      );
    }

    return query.getMany();
  }

  findPendientes() {
    return this.findAll({
      estado:
        EstadoSolicitud.PENDIENTE,
    });
  }

  async findOneOrFail(id: string) {
    const solicitud = await this.repo.findOne({
      where: { id },
      relations: {
        documentos: true,
        matricula: true,
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con ID ${id} no encontrada.`,
      );
    }

    return solicitud;
  }

  async aprobar(id: string) {
    return this.matriculasService
      .crearDesdeSolicitud(id);
  }
}