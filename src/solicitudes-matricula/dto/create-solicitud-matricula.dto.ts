import { IsUUID } from 'class-validator';

export class CreateSolicitudMatriculaDto {
  @IsUUID()
  periodoCarreraId!: string;

  @IsUUID()
  paraleloId!: string;

  // archivoCedulaUrl y archivoNoAdeudarUrl NO van aquí:
  // se arman en el controller a partir de los archivos subidos (multipart),
  // nunca confiamos en una URL que mande el cliente por el body.
}