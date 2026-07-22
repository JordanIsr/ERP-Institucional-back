import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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
}