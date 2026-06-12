import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Body() dto: FirebaseAuthDto) {
    const result = await this.authService.login(dto.id_token);
    return {
      ...result,
      message: 'Login successful'
    };
  }
}