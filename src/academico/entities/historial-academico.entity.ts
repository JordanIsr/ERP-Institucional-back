import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Estudiante } from '../../estudiantes/entities/estudiante.entity';
import { Asignatura } from './asignatura.entity';

export enum EstadoAsignatura {
  APROBADA = 'APROBADA',
  REPROBADA = 'REPROBADA',
}

@Entity('historial_academico')
export class HistorialAcademico {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Estudiante, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante!: Estudiante;

  @ManyToOne(() => Asignatura, { eager: true })
  @JoinColumn({ name: 'asignatura_id' })
  asignatura!: Asignatura;

  @Column({ type: 'float' })
  nota!: number;

  @Column({ type: 'enum', enum: EstadoAsignatura })
  estado!: EstadoAsignatura;
}