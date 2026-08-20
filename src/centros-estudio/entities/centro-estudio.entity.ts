import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum EstadoCentroEstudio {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

@Entity('centros_estudio')
export class CentroEstudio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string; // ej. "Matriz", "Sangolquí"

  @Column({ unique: true })
  codigo!: string; // ej. "MTZ", "SGQ"

  @Column({ type: 'enum', enum: EstadoCentroEstudio, default: EstadoCentroEstudio.ACTIVO })
  estado!: EstadoCentroEstudio;
}