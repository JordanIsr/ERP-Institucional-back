import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AsignaturaParalelo } from './asignatura-paralelo.entity';

export enum DiaSemana {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
}

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AsignaturaParalelo, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asignatura_paralelo_id' })
  asignaturaParalelo!: AsignaturaParalelo;

  @Column({ type: 'enum', enum: DiaSemana })
  dia!: DiaSemana;

  @Column({ type: 'time' })
  horaInicio!: string;

  @Column({ type: 'time' })
  horaFin!: string;
}