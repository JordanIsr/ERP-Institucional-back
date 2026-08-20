import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../users/entities/user.entity';

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

  @Column({
    type: 'enum',
    enum: EstadoDocente,
    default: EstadoDocente.ACTIVO,
  })
  estado!: EstadoDocente;

  @OneToOne(() => User, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: User | null;
}