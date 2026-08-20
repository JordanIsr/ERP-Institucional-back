import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../auth/roles';

@Entity('usuarios') // Nombre de la tabla en PostgreSQL
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  cedula?: string;

  @Column()
  nombre!: string;

  @Column({ unique: true }) // El correo no se puede repetir
  email!: string;

  @Column({ select: false })
  password!: string; // Aquí guardaremos la contraseña encriptada

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USUARIO })
  role: UserRole | undefined; // <-- Aquí se define el nivel de acceso del usuario

  @Column({ default: true })
  isActive!: boolean; // Útil para desactivar usuarios en el ERP sin borrarlos

  @Column({
    default: false,
    name: 'acepto_politica_privacidad',
  })
  aceptoPoliticaPrivacidad!: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'fecha_aceptacion_privacidad',
  })
  fechaAceptacionPrivacidad?: Date | null;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'version_politica_privacidad',
  })
  versionPoliticaPrivacidad?: string | null;
}
