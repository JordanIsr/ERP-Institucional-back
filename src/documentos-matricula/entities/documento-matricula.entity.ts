import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { SolicitudMatricula } from '../../solicitudes-matricula/entities/solicitud-matricula.entity';
import { User } from '../../users/entities/user.entity';

export enum TipoDocumentoMatricula {
  CEDULA = 'CEDULA',
  CERTIFICADO_NO_ADEUDAR = 'CERTIFICADO_NO_ADEUDAR',
  COMPROBANTE_PAGO = 'COMPROBANTE_PAGO',
}

export enum EstadoDocumentoMatricula {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity('documentos_matricula')
@Unique(['solicitud', 'tipo'])
export class DocumentoMatricula {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => SolicitudMatricula,
    (solicitud) => solicitud.documentos,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'solicitud_id' })
  solicitud!: SolicitudMatricula;

  @Column({
    type: 'enum',
    enum: TipoDocumentoMatricula,
  })
  tipo!: TipoDocumentoMatricula;

  @Column({
    name: 'archivo_url',
  })
  archivoUrl!: string;

  @Column({
    type: 'enum',
    enum: EstadoDocumentoMatricula,
    default: EstadoDocumentoMatricula.PENDIENTE,
  })
  estado!: EstadoDocumentoMatricula;

  @Column({
    type: 'text',
    nullable: true,
    name: 'motivo_rechazo',
  })
  motivoRechazo?: string | null;

  @ManyToOne(() => User, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'revisado_por_usuario_id' })
  revisadoPor?: User | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'fecha_revision',
  })
  fechaRevision?: Date | null;

  @CreateDateColumn({
    name: 'fecha_subida',
  })
  fechaSubida!: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
  })
  fechaActualizacion!: Date;
}