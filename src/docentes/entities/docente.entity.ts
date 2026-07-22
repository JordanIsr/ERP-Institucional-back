import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum EstadoDocente {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

@Entity('docentes')
export class Docente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombres!: string;

  @Column()
  apellidos!: string;

  @Column({ unique: true })
  cedula!: string;

  @Column({ nullable: true })
  correo?: string;

  @Column({ type: 'enum', enum: EstadoDocente, default: EstadoDocente.ACTIVO })
  estado!: EstadoDocente;
}