import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  DocumentoMatricula,
  EstadoDocumentoMatricula,
} from './entities/documento-matricula.entity';

import { SolicitudMatricula } from '../solicitudes-matricula/entities/solicitud-matricula.entity';
import { EstadoSolicitud } from '../solicitudes-matricula/entities/solicitud-matricula.entity';
import { User } from '../users/entities/user.entity';
import { RechazarDocumentoDto } from './dto/rechazar-documento.dto';

@Injectable()
export class DocumentosMatriculaService {
  constructor(
    @InjectRepository(DocumentoMatricula)
    private readonly documentoRepository:
      Repository<DocumentoMatricula>,

    private readonly dataSource: DataSource,
  ) {}

  listarPendientes() {
    return this.documentoRepository
      .createQueryBuilder('documento')
      .leftJoinAndSelect(
        'documento.solicitud',
        'solicitud',
      )
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
      .where('documento.estado = :estado', {
        estado: EstadoDocumentoMatricula.PENDIENTE,
      })
      .orderBy('documento.fechaSubida', 'ASC')
      .getMany();
  }

  listarPorSolicitud(solicitudId: string) {
    return this.documentoRepository.find({
      where: {
        solicitud: {
          id: solicitudId,
        },
      },
      order: {
        fechaSubida: 'ASC',
      },
    });
  }

  async aprobar(
    documentoId: string,
    usuarioId: string,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const documentoRepository =
          manager.getRepository(DocumentoMatricula);

        const userRepository =
          manager.getRepository(User);

        const documento =
          await documentoRepository.findOne({
            where: { id: documentoId },
            relations: {
              solicitud: true,
            },
          });

        if (!documento) {
          throw new NotFoundException(
            'Documento no encontrado.',
          );
        }

        if (
          documento.solicitud.estado ===
          EstadoSolicitud.APROBADA
        ) {
          throw new BadRequestException(
            'La solicitud ya fue aprobada.',
          );
        }

        if (
          documento.estado !==
          EstadoDocumentoMatricula.PENDIENTE
        ) {
          throw new BadRequestException(
            'Solamente se pueden aprobar documentos pendientes.',
          );
        }

        const usuario = await userRepository.findOne({
          where: { id: usuarioId },
        });

        if (!usuario) {
          throw new NotFoundException(
            'Usuario revisor no encontrado.',
          );
        }

        documento.estado =
          EstadoDocumentoMatricula.APROBADO;

        documento.revisadoPor = usuario;
        documento.fechaRevision = new Date();
        documento.motivoRechazo = null;

        return documentoRepository.save(documento);
      },
    );
  }

  async rechazar(
    documentoId: string,
    usuarioId: string,
    dto: RechazarDocumentoDto,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const documentoRepository =
          manager.getRepository(DocumentoMatricula);

        const solicitudRepository =
          manager.getRepository(SolicitudMatricula);

        const userRepository =
          manager.getRepository(User);

        const documento =
          await documentoRepository.findOne({
            where: { id: documentoId },
            relations: {
              solicitud: true,
            },
          });

        if (!documento) {
          throw new NotFoundException(
            'Documento no encontrado.',
          );
        }

        if (
          documento.solicitud.estado ===
          EstadoSolicitud.APROBADA
        ) {
          throw new BadRequestException(
            'La solicitud ya fue aprobada.',
          );
        }

        if (
          documento.estado !==
          EstadoDocumentoMatricula.PENDIENTE
        ) {
          throw new BadRequestException(
            'Solamente se pueden rechazar documentos pendientes.',
          );
        }

        const usuario = await userRepository.findOne({
          where: { id: usuarioId },
        });

        if (!usuario) {
          throw new NotFoundException(
            'Usuario revisor no encontrado.',
          );
        }

        documento.estado =
          EstadoDocumentoMatricula.RECHAZADO;

        documento.motivoRechazo =
          dto.motivo.trim();

        documento.revisadoPor = usuario;
        documento.fechaRevision = new Date();

        await documentoRepository.save(documento);

        const solicitud = documento.solicitud;

        solicitud.estado =
          EstadoSolicitud.RECHAZADA;

        solicitud.motivoRechazo =
          `Documento ${documento.tipo}: ${dto.motivo.trim()}`;

        solicitud.puedeReenviar = true;

        await solicitudRepository.save(solicitud);

        return {
          message:
            'Documento y solicitud rechazados correctamente.',
          documento,
          solicitud,
        };
      },
    );
  }
}