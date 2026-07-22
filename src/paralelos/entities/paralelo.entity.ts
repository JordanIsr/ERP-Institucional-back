import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PeriodoCarrera } from '../../periodo-carrera/entities/periodo-carrera.entity';
import { Nivel } from '../../mallas/entities/nivel.entity';

@Entity('paralelos')
@Unique(['periodoCarrera', 'nivel', 'nombre']) // no puede haber dos paralelos "A" en el mismo periodoCarrera+nivel
export class Paralelo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PeriodoCarrera, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'periodo_carrera_id' })
  periodoCarrera!: PeriodoCarrera;

  @ManyToOne(() => Nivel, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'nivel_id' })
  nivel!: Nivel;

  @Column()
  nombre!: string; // ej. "A", "B"

  @Column({ type: 'int' })
  cupoMaximo!: number;
}