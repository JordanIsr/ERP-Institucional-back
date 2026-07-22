import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Carrera } from '../../carreras/entities/carrera.entity';
import { Nivel } from './nivel.entity';

export enum EstadoVersionMalla {
  PROXIMA = 'PROXIMA',
  ACTIVA = 'ACTIVA',
  HISTORICA = 'HISTORICA',
}

@Entity('versiones_malla')
export class VersionMalla {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Carrera, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'carrera_id' })
  carrera!: Carrera;

  @Column()
  nombre!: string;

  @Column()
  version!: string;

  @Column({ type: 'date' })
  fechaVigenciaInicio!: string;

  @Column({ type: 'date', nullable: true })
  fechaVigenciaFin?: string;

  @Column({ type: 'enum', enum: EstadoVersionMalla, default: EstadoVersionMalla.PROXIMA })
  estado!: EstadoVersionMalla;

  @OneToMany(() => Nivel, (nivel) => nivel.versionMalla)
  niveles!: Nivel[];
}