import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, ValueTransformer } from 'typeorm';

import { Matricula } from './matricula.entity';
import { AsignaturaParalelo } from '../../paralelos/entities/asignatura-paralelo.entity';

export enum EstadoMatriculaAsignatura {
  CURSANDO = 'CURSANDO',
  APROBADA = 'APROBADA',
  REPROBADA = 'REPROBADA',
}

const decimalANumero: ValueTransformer = {
  to: (valor: number | null) => valor,
  from: (valor: string | number | null) => {
    if (valor === null || valor === undefined) {
      return null;
    }

    return Number(valor);
  },
};

@Entity('matricula_asignaturas')
@Unique(['matricula', 'asignaturaParalelo'])
export class MatriculaAsignatura {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => Matricula,
    (matricula) => matricula.asignaturas,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'matricula_id' })
  matricula!: Matricula;

  @ManyToOne(() => AsignaturaParalelo, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'asignatura_paralelo_id' })
  asignaturaParalelo!: AsignaturaParalelo;

  @Column({
    type: 'boolean',
    default: false,
    name: 'es_repeticion',
  })
  esRepeticion!: boolean;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'nota_parcial_1',
    transformer: decimalANumero,
  })
  notaParcial1!: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'nota_parcial_2',
    transformer: decimalANumero,
  })
  notaParcial2!: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'nota_recuperacion',
    transformer: decimalANumero,
  })
  notaRecuperacion!: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'promedio_final',
    transformer: decimalANumero,
  })
  promedioFinal!: number | null;

  @Column({
    type: 'enum',
    enum: EstadoMatriculaAsignatura,
    default: EstadoMatriculaAsignatura.CURSANDO,
  })
  estado!: EstadoMatriculaAsignatura;
}