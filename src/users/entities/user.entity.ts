import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios') // Nombre de la tabla en PostgreSQL
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column({ unique: true }) // El correo no se puede repetir
  email!: string;

  @Column()
  password!: string; // Aquí guardaremos la contraseña encriptada

  @Column({ default: true })
  isActive!: boolean; // Útil para desactivar usuarios en el ERP sin borrarlos
}