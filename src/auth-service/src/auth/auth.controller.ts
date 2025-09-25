import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { Request, Response } from 'express';
import { SessionGuard } from '../../common/guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    if (result.require2fa) {
      return result;
    }
    res.cookie('sessionId', result.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
    });

    return { success: true };
  }

  @UseGuards(SessionGuard)
  @Post('2fa/setup')
  async setup2fa(@Req() req: Request) {
    return this.authService.setup2fa(req['user'].userId);
  }

  @UseGuards(SessionGuard)
  @Post('2fa/enable')
  async enable2fa(@Req() req: Request, @Body() body: { code: string }) {
    return this.authService.enable2fa(req['user'].userId, body.code);
  }

  @UseGuards(SessionGuard)
  @Post('2fa/disable')
  async disable2fa(@Req() req: Request) {
    return this.authService.disable2fa(req['user'].userId);
  }

  @Post('2fa/verify')
  async verify2fa(
    @Body() body: { userId: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verify2fa(body.userId, body.code);

    res.cookie('sessionId', result.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
    });
    return { success: true };
  }

  @Post('password-reset/request')
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('password-reset/confirm')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @UseGuards(SessionGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.sessionId;
    await this.authService.logout(sessionId);
    res.clearCookie('sessionId');
    return { success: true, sessionIdEnded: sessionId };
  }

  @UseGuards(SessionGuard)
  @Post('logout-all')
  async logout_all(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req['user'].userId;
    await this.authService.logoutAll(userId);
    res.clearCookie('sessionId');
    return { success: true };
  }
}
