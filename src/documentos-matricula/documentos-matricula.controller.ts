import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { DocumentosMatriculaService } from './documentos-matricula.service';
import { RechazarDocumentoDto } from './dto/rechazar-documento.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('documentos-matricula')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentosMatriculaController {
  constructor(
    private readonly service:
      DocumentosMatriculaService,
  ) {}

  @Get('pendientes')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  pendientes() {
    return this.service.listarPendientes();
  }

  @Get('solicitud/:solicitudId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  porSolicitud(
    @Param('solicitudId') solicitudId: string,
  ) {
    return this.service.listarPorSolicitud(
      solicitudId,
    );
  }

  @Patch(':id/aprobar')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  aprobar(
    @Param('id') documentoId: string,
    @Req() req: any,
  ) {
    return this.service.aprobar(
      documentoId,
      req.user.sub,
    );
  }

  @Patch(':id/rechazar')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  rechazar(
    @Param('id') documentoId: string,
    @Req() req: any,
    @Body() dto: RechazarDocumentoDto,
  ) {
    return this.service.rechazar(
      documentoId,
      req.user.sub,
      dto,
    );
  }
}