import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum EstadoAsignaturaCatalogo {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
}

@Entity('asignaturas_catalogo')
export class Asignatura {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  codigo!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column({ type: 'int', default: 0 })
  horasSemanales!: number;

  @Column({ type: 'enum', enum: EstadoAsignaturaCatalogo, default: EstadoAsignaturaCatalogo.ACTIVA })
  estado!: EstadoAsignaturaCatalogo;
}