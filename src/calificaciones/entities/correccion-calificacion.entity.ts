import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { MatriculaAsignatura } from '../../matriculas/entities/matricula-asignatura.entity';
import { User } from '../../users/entities/user.entity';
import { TipoNota } from '../tipo-nota.enum';

@Entity('correcciones_calificaciones')
export class CorreccionCalificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => MatriculaAsignatura, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'matricula_asignatura_id' })
  matriculaAsignatura!: MatriculaAsignatura;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'corregido_por_usuario_id' })
  corregidoPor!: User;

  @Column({
    type: 'enum',
    enum: TipoNota,
  })
  tipoNota!: TipoNota;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'valor_anterior',
  })
  valorAnterior!: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'valor_nuevo',
  })
  valorNuevo!: number;

  @Column({
    type: 'text',
  })
  motivo!: string;

  @CreateDateColumn()
  fechaCorreccion!: Date;
}