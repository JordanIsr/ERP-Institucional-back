import {
  Controller, Get, Post, Patch, Body, Param, Req,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AcademicoService } from './academico.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicoController {
  constructor(private readonly academicoService: AcademicoService) {}

  @Post('asignaturas')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  crearAsignatura(@Body() datos: any) {
    return this.academicoService.crearAsignatura(datos);
  }

  @Get('asignaturas')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  listarAsignaturas() {
    return this.academicoService.listarAsignaturas();
  }

  @Post('historial')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  registrarNota(@Body() datos: any) {
    return this.academicoService.registrarNota(datos);
  }

  @Get('historial/:estudianteId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  listarHistorial(@Param('estudianteId') estudianteId: string) {
    return this.academicoService.listarHistorialPorEstudiante(estudianteId);
  }

  @Get('historial/mio')
  listarMiHistorial(@Req() request: any) {
    const usuarioId = request.user.sub;
    return this.academicoService.listarHistorialPorUsuario(usuarioId);
  }

  // ---- Comprobantes de pago: subida real de archivo ----
  @Post('comprobantes/:estudianteId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads/comprobantes',
        filename: (req, file, callback) => {
          const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          callback(null, nombreUnico);
        },
      }),
      fileFilter: (req, file, callback) => {
        const tiposPermitidos = /pdf|jpg|jpeg|png/;
        const esValido = tiposPermitidos.test(extname(file.originalname).toLowerCase());
        if (esValido) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Solo se permiten archivos PDF, JPG o PNG'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5MB
    }),
  )
  subirComprobante(
    @Param('estudianteId') estudianteId: string,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    const archivoUrl = `/uploads/comprobantes/${archivo.filename}`;
    return this.academicoService.subirComprobante(estudianteId, archivoUrl);
  }

  @Get('comprobantes/pendientes')
@Roles(UserRole.ADMIN)
listarPendientes() {
  return this.academicoService.listarComprobantesPendientes();
}

@Get('comprobantes/:estudianteId')
@Roles(UserRole.ADMIN, UserRole.SECRETARIA)
listarComprobantes(@Param('estudianteId') estudianteId: string) {
  return this.academicoService.listarComprobantesPorEstudiante(estudianteId);
}

  @Patch('comprobantes/:id/aprobar')
  @Roles(UserRole.ADMIN)
  aprobar(@Param('id') id: string) {
    return this.academicoService.aprobarComprobante(id);
  }

  @Patch('comprobantes/:id/rechazar')
  @Roles(UserRole.ADMIN)
  rechazar(@Param('id') id: string) {
    return this.academicoService.rechazarComprobante(id);
  }
}