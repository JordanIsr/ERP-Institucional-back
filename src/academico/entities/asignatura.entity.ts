import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asignaturas')
export class Asignatura {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column()
  carrera!: string;

  @Column()
  periodo!: string;
}