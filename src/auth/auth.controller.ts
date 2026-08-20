import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth') // Al combinarse con el global prefix de main.ts, la ruta será /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') // La ruta final será POST: http://localhost:3000/api/auth/register
  register(@Body() userData: RegisterDto) {
    return this.authService.register(userData);
  }

  @Post('login')
  login(@Body() userData: any) {
    return this.authService.login(userData);
  }
}
