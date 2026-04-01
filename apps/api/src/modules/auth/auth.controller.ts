// apps/api/src/modules/auth/auth.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dashboard login — returns JWT access token' })
  async login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
    const result = await this.authService.loginDashboard(dto.email, dto.password);
    if (!result) {
      throw new Error('Invalid credentials');
    }
    return result;
  }
}
