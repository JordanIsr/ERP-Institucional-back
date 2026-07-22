import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

export enum EstadoMatricula {
  APROBADA = 'APROBADA',
  PENDIENTE = 'PENDIENTE',
  ANULADA = 'ANULADA',
}

@Entity('estudiantes')
export class Estudiante {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  cedula!: string;

  @Column()
  nombres!: string;

  @Column()
  apellidos!: string;

  @Column({ nullable: true })
  correo!: string;

  @Column({ nullable: true })
  telefono!: string;

  @Column()
  carrera!: string;

  @Column()
  periodo!: string;

  @Column()
  jornada!: string;

  @Column({ type: 'enum', enum: EstadoMatricula, default: EstadoMatricula.PENDIENTE })
  estado!: EstadoMatricula;

  @OneToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: User;
}