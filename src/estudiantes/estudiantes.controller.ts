import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('estudiantes')
@UseGuards(JwtAuthGuard, RolesGuard) // protege TODO el controller: requiere token válido
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Post()
  @Roles(UserRole.SECRETARIA)
  create(@Body() createEstudianteDto: CreateEstudianteDto) {
    return this.estudiantesService.create(createEstudianteDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll() {
    return this.estudiantesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.estudiantesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SECRETARIA)
  update(@Param('id') id: string, @Body() updateEstudianteDto: UpdateEstudianteDto) {
    return this.estudiantesService.update(id, updateEstudianteDto);
  }

  @Delete(':id')
  @Roles(UserRole.SECRETARIA)
  remove(@Param('id') id: string) {
    return this.estudiantesService.remove(id);
  }
}
