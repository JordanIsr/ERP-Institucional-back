import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AsignaturasService } from './asignaturas.service';
import { CreateAsignaturaDto } from './dto/create-asignatura.dto';
import { UpdateAsignaturaDto } from './dto/update-asignatura.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('asignaturas-catalogo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsignaturasController {
  constructor(private readonly asignaturasService: AsignaturasService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateAsignaturaDto) {
    return this.asignaturasService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll() {
    return this.asignaturasService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.asignaturasService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAsignaturaDto) {
    return this.asignaturasService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.asignaturasService.remove(id);
  }
}
