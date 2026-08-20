import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { VersionMalla } from './version-malla.entity';
import { DetalleMalla } from './detalle-malla.entity';

@Entity('niveles')
export class Nivel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => VersionMalla, (versionMalla) => versionMalla.niveles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'version_malla_id' })
  versionMalla!: VersionMalla;

  @Column({ type: 'int' })
  numero!: number;

  @Column({ nullable: true })
  nombre?: string;

  @OneToMany(() => DetalleMalla, (detalle) => detalle.nivel)
  detalles!: DetalleMalla[];
}