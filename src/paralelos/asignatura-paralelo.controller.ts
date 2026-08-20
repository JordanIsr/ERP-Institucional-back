import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AsignaturaParaleloService } from './asignatura-paralelo.service';
import { CreateAsignaturaParaleloDto } from './dto/create-asignatura-paralelo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('asignatura-paralelo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsignaturaParaleloController {
  constructor(private readonly asignaturaParaleloService: AsignaturaParaleloService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  agregar(@Body() dto: CreateAsignaturaParaleloDto) {
    return this.asignaturaParaleloService.agregar(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  listarPorParalelo(@Query('paraleloId') paraleloId: string) {
    return this.asignaturaParaleloService.listarPorParalelo(paraleloId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  quitar(@Param('id') id: string) {
    return this.asignaturaParaleloService.quitar(id);
  }
}
