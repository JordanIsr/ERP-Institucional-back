import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DetalleMallaService } from './detalle-malla.service';
import { CreateDetalleMallaDto } from './dto/create-detalle-malla.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('detalle-malla')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DetalleMallaController {
  constructor(private readonly detalleMallaService: DetalleMallaService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  agregar(@Body() dto: CreateDetalleMallaDto) {
    return this.detalleMallaService.agregar(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  listarPorNivel(@Query('nivelId') nivelId: string) {
    return this.detalleMallaService.listarPorNivel(nivelId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  quitar(@Param('id') id: string) {
    return this.detalleMallaService.quitar(id);
  }
}