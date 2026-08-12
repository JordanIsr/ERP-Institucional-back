import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Estudiante } from '../../estudiantes/entities/estudiante.entity';
import { Asignatura } from './asignatura.entity';
import { AsignaturaParalelo } from '../../paralelos/entities/asignatura-paralelo.entity';

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

  // NUEVO — nullable a propósito: se llenará cuando exista el módulo de Matrículas,
  // que es lo que sabrá en qué Paralelo/Periodo estaba inscrito el estudiante al recibir esta nota.
  // Mientras tanto, el flujo actual (nota manual por secretaría) sigue funcionando sin este dato.
  @ManyToOne(() => AsignaturaParalelo, { eager: true, nullable: true })
  @JoinColumn({ name: 'asignatura_paralelo_id' })
  asignaturaParalelo?: AsignaturaParalelo;

  @Column({ type: 'float' })
  nota!: number;

  @Column({ type: 'enum', enum: EstadoAsignatura })
  estado!: EstadoAsignatura;
}