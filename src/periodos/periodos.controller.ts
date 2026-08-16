import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PeriodosService } from './periodos.service';
import { CreatePeriodoDto } from './dto/create-periodo.dto';
import { UpdatePeriodoDto } from './dto/update-periodo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('periodos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodosController {
  constructor(private readonly periodosService: PeriodosService) {}

  @Post()
  @Roles(UserRole.SECRETARIA)
  create(@Body() dto: CreatePeriodoDto) {
    return this.periodosService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll() {
    return this.periodosService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.periodosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SECRETARIA)
  update(@Param('id') id: string, @Body() dto: UpdatePeriodoDto) {
    return this.periodosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SECRETARIA)
  remove(@Param('id') id: string) {
    return this.periodosService.remove(id);
  }
}