export class CreateEstudianteDto {
  cedula!: string;
  nombres!: string;
  apellidos!: string;
  correo!: string;
  telefono?: string; // El signo ? significa que es opcional
  carrera!: string;
  periodo!: string;
  jornada!: string;
}