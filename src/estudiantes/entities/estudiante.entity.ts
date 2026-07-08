// src/estudiantes/entities/estudiante.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';

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
  telefono!: string;

  @Column()
  carrera!: string;

  @Column()
  periodo!: string;

  @Column()
  jornada!: string;
}