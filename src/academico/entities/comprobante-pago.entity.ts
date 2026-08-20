import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Estudiante } from '../../estudiantes/entities/estudiante.entity';

export enum EstadoComprobante {
  PENDIENTE = 'PENDIENTE',
  VERIFICADO = 'VERIFICADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity('comprobantes_pago')
export class ComprobantePago {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Estudiante, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante!: Estudiante;

  @Column()
  archivoUrl!: string;

  @Column({ type: 'enum', enum: EstadoComprobante, default: EstadoComprobante.PENDIENTE })
  estado!: EstadoComprobante;

  @CreateDateColumn()
  fechaSubida!: Date;
}