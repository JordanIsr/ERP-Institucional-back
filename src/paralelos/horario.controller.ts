import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { HorarioService } from './horario.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('horarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HorarioController {
  constructor(private readonly horarioService: HorarioService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  crear(@Body() dto: CreateHorarioDto) {
    return this.horarioService.crear(dto);
  }

  @Get('por-paralelo')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  listarPorParalelo(@Query('paraleloId') paraleloId: string) {
    return this.horarioService.listarPorParalelo(paraleloId);
  }

  @Get('mios')
  @Roles(UserRole.DOCENTE)
  listarMios(@Req() req: any) {
    return this.horarioService.listarPorUsuarioDocente(req.user.sub);
  }

  @Get('por-docente')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  listarPorDocente(@Query('docenteId') docenteId: string) {
    return this.horarioService.listarPorDocente(docenteId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  eliminar(@Param('id') id: string) {
    return this.horarioService.eliminar(id);
  }
}
