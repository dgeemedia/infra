// apps/api/src/modules/auth/auth.controller.ts
import {
  Body, Controller, HttpCode, HttpStatus, Post,
  UnauthorizedException, Ip, Headers,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public }      from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto }    from './auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dashboard login — returns JWT access token' })
  async login(
    @Body()                     dto:          LoginDto,
    @Ip()                       ip:           string,
    @Headers('x-forwarded-for') forwardedFor: string | undefined,
    @Headers('user-agent')      userAgent:    string | undefined,
  ): Promise<{ accessToken: string }> {
    const resolvedIp = forwardedFor?.split(',')[0]?.trim() ?? ip ?? 'unknown';

    const result = await this.authService.loginDashboard(
      dto.email,
      dto.password,
      resolvedIp,
      userAgent,
    );

    if (!result) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return result;
  }
}