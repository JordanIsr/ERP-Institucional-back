import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SolicitudesMatriculaService } from './solicitudes-matricula.service';
import { CreateSolicitudMatriculaDto } from './dto/create-solicitud-matricula.dto';
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';
import { EstadoSolicitud } from './entities/solicitud-matricula.entity';

// Configuración de subida: SOLO PDF, máximo 5MB por archivo, se aplica a ambos campos
const opcionesSubidaPdf = {
  storage: diskStorage({
    destination: './uploads/solicitudes-matricula',
    filename: (req: any, file: any, callback: any) => {
      const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      callback(null, nombreUnico);
    },
  }),
  fileFilter: (req: any, file: any, callback: any) => {
    const esPdf = extname(file.originalname).toLowerCase() === '.pdf';
    if (esPdf) {
      callback(null, true);
    } else {
      callback(new BadRequestException(`El archivo "${file.originalname}" debe ser PDF.`), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
};

@Controller('solicitudes-matricula')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolicitudesMatriculaController {
  constructor(private readonly service: SolicitudesMatriculaService) {}

  // ---------- ESTUDIANTE: enviar solicitud nueva ----------
  @Post()
  @Roles(UserRole.ESTUDIANTE)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cedula', maxCount: 1 },
        { name: 'noAdeudar', maxCount: 1 },
      ],
      opcionesSubidaPdf,
    ),
  )
  crear(
    @Req() req: any,
    @Body() dto: CreateSolicitudMatriculaDto,
    @UploadedFiles()
    archivos: { cedula?: Express.Multer.File[]; noAdeudar?: Express.Multer.File[] },
  ) {
    if (!archivos?.cedula?.[0] || !archivos?.noAdeudar?.[0]) {
      throw new BadRequestException(
        'Debes subir ambos archivos: copia de cédula y certificado de no adeudar (PDF).',
      );
    }
    const usuarioId = req.user.sub;
    const archivoCedulaUrl = `/uploads/solicitudes-matricula/${archivos.cedula[0].filename}`;
    const archivoNoAdeudarUrl = `/uploads/solicitudes-matricula/${archivos.noAdeudar[0].filename}`;
    return this.service.crear(usuarioId, dto, archivoCedulaUrl, archivoNoAdeudarUrl);
  }

  // ---------- ESTUDIANTE: reenviar tras rechazo ----------
  @Patch(':id/reenviar')
  @Roles(UserRole.ESTUDIANTE)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cedula', maxCount: 1 },
        { name: 'noAdeudar', maxCount: 1 },
      ],
      opcionesSubidaPdf,
    ),
  )
  reenviar(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFiles()
    archivos: { cedula?: Express.Multer.File[]; noAdeudar?: Express.Multer.File[] },
  ) {
    const usuarioId = req.user.sub;
    const archivoCedulaUrl = archivos?.cedula?.[0]
      ? `/uploads/solicitudes-matricula/${archivos.cedula[0].filename}`
      : null;
    const archivoNoAdeudarUrl = archivos?.noAdeudar?.[0]
      ? `/uploads/solicitudes-matricula/${archivos.noAdeudar[0].filename}`
      : null;
    return this.service.reenviar(usuarioId, id, archivoCedulaUrl, archivoNoAdeudarUrl);
  }

  // ---------- ESTUDIANTE: ver sus propias solicitudes ----------
  @Get('mias')
  @Roles(UserRole.ESTUDIANTE)
  misSolicitudes(@Req() req: any) {
    return this.service.misSolicitudes(req.user.sub);
  }

  // ---------- ESTUDIANTE: "Mi Matrícula" vigente ----------
  @Get('mi-matricula')
  @Roles(UserRole.ESTUDIANTE)
  miMatricula(@Req() req: any) {
    return this.service.miMatriculaVigente(req.user.sub);
  }

  // ---------- SECRETARIA/ADMIN: listar todas / filtradas ----------
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll(
    @Query('periodoCarreraId') periodoCarreraId?: string,
    @Query('estado') estado?: EstadoSolicitud,
    @Query('busqueda') busqueda?: string,
  ) {
    return this.service.findAll({ periodoCarreraId, estado, busqueda });
  }

  // ---------- SECRETARIA/ADMIN: solo pendientes ----------
  @Get('pendientes')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  pendientes() {
    return this.service.findPendientes();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.service.findOneOrFail(id);
  }

  // ---------- SECRETARIA: aprobar ----------
  @Patch(':id/aprobar')
  @Roles(UserRole.SECRETARIA)
  aprobar(@Param('id') id: string) {
    return this.service.aprobar(id);
  }

  // ---------- SECRETARIA: rechazar ----------
  @Patch(':id/rechazar')
  @Roles(UserRole.SECRETARIA)
  rechazar(@Param('id') id: string, @Body() dto: RechazarSolicitudDto) {
    return this.service.rechazar(id, dto);
  }
}