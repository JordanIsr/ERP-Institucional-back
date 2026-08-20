import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

import { Estudiante } from '../../estudiantes/entities/estudiante.entity';
import { PeriodoAcademico } from '../../periodos/entities/periodo-academico.entity';
import { PeriodoCarrera } from '../../periodo-carrera/entities/periodo-carrera.entity';
import { Paralelo } from '../../paralelos/entities/paralelo.entity';
import { VersionMalla } from '../../mallas/entities/version-malla.entity';
import { Nivel } from '../../mallas/entities/nivel.entity';
import { MatriculaAsignatura } from './matricula-asignatura.entity';

export enum TipoMatricula {
  NUEVA = 'NUEVA',
  REGULAR = 'REGULAR',
  REPETICION = 'REPETICION',
  REINICIO_MALLA = 'REINICIO_MALLA',
}

export enum EstadoMatricula {
  ACTIVA = 'ACTIVA',
  FINALIZADA = 'FINALIZADA',
  ANULADA = 'ANULADA',
}

@Entity('matriculas')
@Unique(['estudiante', 'periodo'])
export class Matricula {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Estudiante, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante!: Estudiante;

  /*
   * Se guarda el periodo directamente para impedir que un estudiante
   * tenga dos matrículas en ofertas diferentes del mismo periodo.
   */
  @ManyToOne(() => PeriodoAcademico, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'periodo_id' })
  periodo!: PeriodoAcademico;

  @ManyToOne(() => PeriodoCarrera, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'periodo_carrera_id' })
  periodoCarrera!: PeriodoCarrera;

  @ManyToOne(() => Paralelo, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'paralelo_id' })
  paralelo!: Paralelo;

  /*
   * Se guardan explícitamente la malla y el nivel como datos históricos.
   * Así una modificación futura de la oferta no altera la matrícula.
   */
  @ManyToOne(() => VersionMalla, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'version_malla_id' })
  versionMalla!: VersionMalla;

  @ManyToOne(() => Nivel, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'nivel_id' })
  nivel!: Nivel;

  @Column({
    type: 'enum',
    enum: TipoMatricula,
  })
  tipo!: TipoMatricula;

  @Column({
    type: 'enum',
    enum: EstadoMatricula,
    default: EstadoMatricula.ACTIVA,
  })
  estado!: EstadoMatricula;

  @OneToMany(
    () => MatriculaAsignatura,
    (detalle) => detalle.matricula,
    {
      cascade: true,
    },
  )
  asignaturas!: MatriculaAsignatura[];

  @CreateDateColumn({
    name: 'fecha_matricula',
  })
  fechaMatricula!: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
  })
  fechaActualizacion!: Date;
}