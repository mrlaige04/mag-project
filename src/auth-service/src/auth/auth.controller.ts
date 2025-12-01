import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiCookieAuth } from '@nestjs/swagger';
import { RegisterDto, LoginDto } from './dto';
import { Request, Response } from 'express';
import { SessionGuard } from '../../common/guards';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    description: 'Registration payload',
    type: RegisterDto,
    schema: {
      example: {
        email: 'user@example.com',
        phone: '+380931234567',
        password: 'StrongPassword123',
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
      },
    },
  })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive a session cookie or 2FA requirement' })
  @ApiBody({
    description: 'Login payload',
    type: LoginDto,
    schema: {
      example: {
        phone: '+380931234567',
        password: 'StrongPassword123',
      },
    },
  })
  @ApiOkResponse({ description: 'Login successful or 2FA required' })
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
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 5 * 60 * 1000, // 5 minutes
    });

    return { success: true };
  }

  @UseGuards(SessionGuard)
  @Post('2fa/setup')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Generate 2FA secret and QR for the logged-in user' })
  @ApiOkResponse({ description: '2FA setup info returned' })
  async setup2fa(@Req() req: Request) {
    return this.authService.setup2fa(req['user'].userId);
  }

  @UseGuards(SessionGuard)
  @Post('2fa/enable')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Enable 2FA for the logged-in user' })
  @ApiBody({ schema: { properties: { code: { type: 'string' } }, required: ['code'] } })
  @ApiOkResponse({ description: '2FA enabled' })
  async enable2fa(@Req() req: Request, @Body() body: { code: string }) {
    return this.authService.enable2fa(req['user'].userId, body.code);
  }

  @UseGuards(SessionGuard)
  @Post('2fa/disable')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Disable 2FA for the logged-in user' })
  @ApiOkResponse({ description: '2FA disabled' })
  async disable2fa(@Req() req: Request) {
    return this.authService.disable2fa(req['user'].userId);
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA code during login and set session cookie' })
  @ApiBody({ schema: { properties: { userId: { type: 'string' }, code: { type: 'string' } }, required: ['userId', 'code'] } })
  @ApiOkResponse({ description: '2FA verified and session cookie set' })
  async verify2fa(
    @Body() body: { userId: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verify2fa(body.userId, body.code);

    res.cookie('sessionId', result.sessionId, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
    return { success: true };
  }

  @Post('password-reset/request')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ schema: { properties: { email: { type: 'string', format: 'email' } }, required: ['email'] } })
  @ApiOkResponse({ description: 'Reset email sent if account exists' })
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiBody({ schema: { properties: { token: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } }, required: ['token', 'newPassword'] } })
  @ApiOkResponse({ description: 'Password reset successful' })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @UseGuards(SessionGuard)
  @Post('logout')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiOkResponse({ description: 'Session terminated' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.sessionId;
    await this.authService.logout(sessionId);
    res.clearCookie('sessionId', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    });
    return { success: true, sessionIdEnded: sessionId };
  }

  @UseGuards(SessionGuard)
  @Post('logout-all')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Logout all sessions for current user' })
  @ApiOkResponse({ description: 'All sessions terminated' })
  async logout_all(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req['user'].userId;
    await this.authService.logoutAll(userId);
    res.clearCookie('sessionId', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    });
    return { success: true };
  }
}
