import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Paralelo } from './paralelo.entity';
import { DetalleMalla } from '../../mallas/entities/detalle-malla.entity';
import { Docente } from '../../docentes/entities/docente.entity';

@Entity('asignatura_paralelo')
@Unique(['paralelo', 'detalleMalla']) // una asignatura no puede repetirse dos veces en el mismo paralelo
export class AsignaturaParalelo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
  () => Paralelo, (paralelo) => paralelo.asignaturas, { eager: true, onDelete: 'CASCADE',})
  paralelo!: Paralelo;

  @ManyToOne(() => DetalleMalla, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'detalle_malla_id' })
  detalleMalla!: DetalleMalla;

  @ManyToOne(() => Docente, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'docente_id' })
  docente!: Docente;
}