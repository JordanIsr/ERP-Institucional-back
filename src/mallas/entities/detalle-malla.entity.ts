import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Nivel } from './nivel.entity';
import { Asignatura } from '../../asignaturas/entities/asignatura.entity';
import { AsignaturaParalelo } from '../../paralelos/entities/asignatura-paralelo.entity'; // Importar entidad

@Entity('detalle_malla')
export class DetalleMalla {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Nivel, (nivel) => nivel.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nivel_id' })
  nivel!: Nivel;

  @ManyToOne(() => Asignatura, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'asignatura_id' })
  asignatura!: Asignatura;

  @OneToMany(() => AsignaturaParalelo, (ap) => ap.detalleMalla)
  asignaturaParalelos!: AsignaturaParalelo[];
}