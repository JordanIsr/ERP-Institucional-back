import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PeriodoAcademico } from '../../periodos/entities/periodo-academico.entity';
import { Carrera } from '../../carreras/entities/carrera.entity';
import { VersionMalla } from '../../mallas/entities/version-malla.entity';
import { CentroEstudio } from '../../centros-estudio/entities/centro-estudio.entity';

export enum Jornada {
  MATUTINA = 'MATUTINA',
  VESPERTINA = 'VESPERTINA',
  NOCTURNA = 'NOCTURNA',
}

export enum EstadoPeriodoCarrera {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
}

@Entity('periodo_carrera')
@Unique(['periodo', 'carrera', 'jornada', 'centroEstudio'])
export class PeriodoCarrera {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PeriodoAcademico, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'periodo_id' })
  periodo!: PeriodoAcademico;

  @ManyToOne(() => Carrera, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'carrera_id' })
  carrera!: Carrera;

  @ManyToOne(() => VersionMalla, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'version_malla_id' })
  versionMalla!: VersionMalla;

  @ManyToOne(() => CentroEstudio, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'centro_estudio_id' })
  centroEstudio!: CentroEstudio;

  @Column({ type: 'enum', enum: Jornada })
  jornada!: Jornada;

  @Column({ type: 'enum', enum: EstadoPeriodoCarrera, default: EstadoPeriodoCarrera.ACTIVA })
  estado!: EstadoPeriodoCarrera;
}