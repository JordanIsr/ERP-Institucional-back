import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { SolicitudesMatriculaService } from './solicitudes-matricula.service';
import { CreateSolicitudMatriculaDto } from './dto/create-solicitud-matricula.dto';
import { EstadoSolicitud } from './entities/solicitud-matricula.entity';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

const opcionesSubidaPdf = {
  storage: diskStorage({
    destination: './uploads/solicitudes-matricula',

    filename: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const nombreUnico =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}.pdf`;

      callback(null, nombreUnico);
    },
  }),

  fileFilter: (
    req: any,
    file: Express.Multer.File,
    callback: (
      error: Error | null,
      aceptar: boolean,
    ) => void,
  ) => {
    const extension =
      extname(file.originalname).toLowerCase();

    const esPdf =
      extension === '.pdf' &&
      file.mimetype === 'application/pdf';

    if (!esPdf) {
      callback(
        new BadRequestException(
          `El archivo "${file.originalname}" debe ser PDF.`,
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
};

interface ArchivosSolicitud {
  cedula?: Express.Multer.File[];
  certificadoNoAdeudar?: Express.Multer.File[];
  comprobantePago?: Express.Multer.File[];
}

@Controller('solicitudes-matricula')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolicitudesMatriculaController {
  constructor(
    private readonly service:
      SolicitudesMatriculaService,
  ) {}

  private construirUrl(
    archivo?: Express.Multer.File,
  ): string | undefined {
    if (!archivo) {
      return undefined;
    }

    return `/uploads/solicitudes-matricula/${archivo.filename}`;
  }

  @Post()
  @Roles(UserRole.ESTUDIANTE)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'cedula',
          maxCount: 1,
        },
        {
          name: 'certificadoNoAdeudar',
          maxCount: 1,
        },
        {
          name: 'comprobantePago',
          maxCount: 1,
        },
      ],
      opcionesSubidaPdf,
    ),
  )
  crear(
    @Req() req: any,
    @Body() dto: CreateSolicitudMatriculaDto,
    @UploadedFiles()
    archivos: ArchivosSolicitud,
  ) {
    const cedula =
      archivos?.cedula?.[0];

    const certificado =
      archivos?.certificadoNoAdeudar?.[0];

    const comprobante =
      archivos?.comprobantePago?.[0];

    if (!cedula) {
      throw new BadRequestException(
        'Debes subir la copia de cédula en PDF.',
      );
    }

    if (!certificado && !comprobante) {
      throw new BadRequestException(
        'Debes subir el certificado de no adeudar o el comprobante de pago.',
      );
    }

    if (certificado && comprobante) {
      throw new BadRequestException(
        'No debes subir certificado de no adeudar y comprobante de pago al mismo tiempo.',
      );
    }

    return this.service.crear(
      req.user.sub,
      dto,
      {
        cedulaUrl: this.construirUrl(cedula)!,
        certificadoNoAdeudarUrl:
          this.construirUrl(certificado),
        comprobantePagoUrl:
          this.construirUrl(comprobante),
      },
    );
  }

  @Patch(':id/reenviar')
  @Roles(UserRole.ESTUDIANTE)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'cedula',
          maxCount: 1,
        },
        {
          name: 'certificadoNoAdeudar',
          maxCount: 1,
        },
        {
          name: 'comprobantePago',
          maxCount: 1,
        },
      ],
      opcionesSubidaPdf,
    ),
  )
  reenviar(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFiles()
    archivos: ArchivosSolicitud,
  ) {
    return this.service.reenviar(
      req.user.sub,
      id,
      {
        cedulaUrl: this.construirUrl(
          archivos?.cedula?.[0],
        ),
        certificadoNoAdeudarUrl:
          this.construirUrl(
            archivos?.certificadoNoAdeudar?.[0],
          ),
        comprobantePagoUrl:
          this.construirUrl(
            archivos?.comprobantePago?.[0],
          ),
      },
    );
  }

  @Get('mias')
  @Roles(UserRole.ESTUDIANTE)
  misSolicitudes(@Req() req: any) {
    return this.service.misSolicitudes(
      req.user.sub,
    );
  }

  @Get('mi-matricula')
  @Roles(UserRole.ESTUDIANTE)
  miMatricula(@Req() req: any) {
    return this.service.miMatriculaVigente(
      req.user.sub,
    );
  }

  @Get('pendientes')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  pendientes() {
    return this.service.findPendientes();
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll(
    @Query('periodoCarreraId')
    periodoCarreraId?: string,

    @Query('carreraId')
    carreraId?: string,

    @Query('periodoId')
    periodoId?: string,

    @Query('paraleloId')
    paraleloId?: string,

    @Query('estado')
    estado?: EstadoSolicitud,

    @Query('busqueda')
    busqueda?: string,
  ) {
    return this.service.findAll({
      periodoCarreraId,
      carreraId,
      periodoId,
      paraleloId,
      estado,
      busqueda,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.service.findOneOrFail(id);
  }

  @Patch(':id/aprobar')
  @Roles(UserRole.SECRETARIA)
  aprobar(@Param('id') id: string) {
    return this.service.aprobar(id);
  }
}