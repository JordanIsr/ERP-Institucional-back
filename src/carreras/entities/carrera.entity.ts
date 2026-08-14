import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { VersionMalla } from '../../mallas/entities/version-malla.entity';

export enum EstadoCarrera {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
}

@Entity('carreras')
export class Carrera {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column({ unique: true })
  codigo!: string;

  @Column({ type: 'enum', enum: EstadoCarrera, default: EstadoCarrera.ACTIVA })
  estado!: EstadoCarrera;

  @CreateDateColumn()
  fechaCreacion!: Date;

  @OneToMany(() => VersionMalla, (versionMalla) => versionMalla.carrera)
  versionesMalla!: VersionMalla[];
}