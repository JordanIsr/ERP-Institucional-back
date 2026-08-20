import { BadRequestException, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';

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
  constructor(
    private readonly academicoService: AcademicoService,
  ) {}

  @Post('comprobantes/:estudianteId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads/comprobantes',

        filename: (req, file, callback) => {
          const nombreUnico =
            `${Date.now()}-${Math.round(
              Math.random() * 1e9,
            )}.pdf`;

          callback(null, nombreUnico);
        },
      }),

      fileFilter: (req, file, callback) => {
        const extension =
          extname(file.originalname).toLowerCase();

        const esPdf =
          extension === '.pdf' &&
          file.mimetype === 'application/pdf';

        if (!esPdf) {
          callback(
            new BadRequestException(
              'Solamente se permiten archivos PDF.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },

      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  subirComprobante(
    @Param('estudianteId') estudianteId: string,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new BadRequestException(
        'No se recibió ningún archivo PDF.',
      );
    }

    const archivoUrl =
      `/uploads/comprobantes/${archivo.filename}`;

    return this.academicoService.subirComprobante(
      estudianteId,
      archivoUrl,
    );
  }

  @Get('comprobantes/pendientes')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  listarPendientes() {
    return this.academicoService
      .listarComprobantesPendientes();
  }

  @Get('comprobantes/:estudianteId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  listarComprobantes(
    @Param('estudianteId') estudianteId: string,
  ) {
    return this.academicoService
      .listarComprobantesPorEstudiante(
        estudianteId,
      );
  }

  @Patch('comprobantes/:id/aprobar')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  aprobar(
    @Param('id') id: string,
  ) {
    return this.academicoService
      .aprobarComprobante(id);
  }

  @Patch('comprobantes/:id/rechazar')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  rechazar(
    @Param('id') id: string,
  ) {
    return this.academicoService
      .rechazarComprobante(id);
  }
}