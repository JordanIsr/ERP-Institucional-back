import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum EstadoPeriodo {
  PLANIFICADO = 'PLANIFICADO',
  ACTIVO = 'ACTIVO',
  CERRADO = 'CERRADO',
}

@Entity('periodos_academicos')
export class PeriodoAcademico {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nombre!: string; // ej. "2026-I"

  @Column({ type: 'date' })
  fechaInicio!: string;

  @Column({ type: 'date' })
  fechaFin!: string;

  @Column({ type: 'enum', enum: EstadoPeriodo, default: EstadoPeriodo.PLANIFICADO })
  estado!: EstadoPeriodo;
}