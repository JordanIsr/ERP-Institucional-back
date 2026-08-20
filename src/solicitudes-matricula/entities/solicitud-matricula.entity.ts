import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, OneToMany,JoinColumn, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Estudiante } from '../../estudiantes/entities/estudiante.entity';
import { PeriodoCarrera } from '../../periodo-carrera/entities/periodo-carrera.entity';
import { Paralelo } from '../../paralelos/entities/paralelo.entity';
import { Matricula } from '../../matriculas/entities/matricula.entity';
import { DocumentoMatricula } from 'src/documentos-matricula/entities/documento-matricula.entity';

export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

// Una sola fila por estudiante+periodoCarrera. El "bucle" de rechazo/reenvío
// se maneja actualizando esta misma fila, no creando filas nuevas.
@Entity('solicitudes_matricula')
@Unique(['estudiante', 'periodoCarrera'])
export class SolicitudMatricula {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Estudiante, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante!: Estudiante;

  @ManyToOne(() => PeriodoCarrera, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'periodo_carrera_id' })
  periodoCarrera!: PeriodoCarrera;

  @ManyToOne(() => Paralelo, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paralelo_id' })
  paralelo!: Paralelo;

  @OneToOne(() => Matricula, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'matricula_id' })
  matricula?: Matricula;

  @OneToMany(() => DocumentoMatricula, (documento) => documento.solicitud, { cascade: true,},)
  documentos!: DocumentoMatricula[];

  @Column({ type: 'enum', enum: EstadoSolicitud, default: EstadoSolicitud.PENDIENTE })
  estado!: EstadoSolicitud;

  @Column({ nullable: true })
  motivoRechazo?: string;

  // true solo cuando está RECHAZADA y el estudiante todavía no reenvía (candado de "una vez a la vez")
  @Column({ default: false })
  puedeReenviar!: boolean;

  @CreateDateColumn()
  fechaEnvio!: Date;

  @UpdateDateColumn()
  fechaActualizacion!: Date;
}