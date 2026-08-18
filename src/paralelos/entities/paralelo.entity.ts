import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { PeriodoCarrera } from '../../periodo-carrera/entities/periodo-carrera.entity';
import { Nivel } from '../../mallas/entities/nivel.entity';
import { Aula } from '../../aula/entities/aula.entity';
import { AsignaturaParalelo } from './asignatura-paralelo.entity';

@Entity('paralelos')
@Unique(['periodoCarrera', 'nivel', 'nombre'])
export class Paralelo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PeriodoCarrera, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'periodo_carrera_id' })
  periodoCarrera!: PeriodoCarrera;

  @ManyToOne(() => Nivel, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'nivel_id' })
  nivel!: Nivel;

  @OneToMany(
  () => AsignaturaParalelo, (asignaturaParalelo) => asignaturaParalelo.paralelo,)
  asignaturas!: AsignaturaParalelo[];

  @ManyToOne(() => Aula, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'aula_id' })
  aula!: Aula;

  @Column()
  nombre!: string;

  @Column({ type: 'int' })
  cupoMaximo!: number;
}