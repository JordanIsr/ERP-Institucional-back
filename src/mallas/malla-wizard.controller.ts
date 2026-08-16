import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MallaWizardService } from './malla-wizard.service';
import { CrearMallaRapidaDto } from './dto/crear-malla-rapida.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('mallas/crear-rapida')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MallaWizardController {
  constructor(private readonly mallaWizardService: MallaWizardService) {}

  @Post()
  @Roles(UserRole.SECRETARIA)
  crear(@Body() dto: CrearMallaRapidaDto) {
    return this.mallaWizardService.crearMallaCompleta(dto);
  }
}