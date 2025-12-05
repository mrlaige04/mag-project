import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterDto, LoginDto } from './dto';
import { Request } from 'express';
import { JwtGuard } from '@app/common';

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
  @ApiOperation({ summary: 'Login and receive JWT access/refresh tokens or 2FA requirement' })
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
  @ApiOkResponse({ description: 'Login successful (returns accessToken & refreshToken with expiration times) or 2FA required' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtGuard)
  @Post('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret and QR for the logged-in user' })
  @ApiOkResponse({ description: '2FA setup info returned' })
  async setup2fa(@Req() req: Request) {
    return this.authService.setup2fa(req['user'].userId);
  }

  @UseGuards(JwtGuard)
  @Post('2fa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA for the logged-in user' })
  @ApiBody({ schema: { properties: { code: { type: 'string' } }, required: ['code'] } })
  @ApiOkResponse({ description: '2FA enabled' })
  async enable2fa(@Req() req: Request, @Body() body: { code: string }) {
    return this.authService.enable2fa(req['user'].userId, body.code);
  }

  @UseGuards(JwtGuard)
  @Post('2fa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA for the logged-in user' })
  @ApiOkResponse({ description: '2FA disabled' })
  async disable2fa(@Req() req: Request) {
    return this.authService.disable2fa(req['user'].userId);
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA code during login and receive JWT access/refresh tokens' })
  @ApiBody({ schema: { properties: { userId: { type: 'string' }, code: { type: 'string' } }, required: ['userId', 'code'] } })
  @ApiOkResponse({ description: '2FA verified and JWT access/refresh tokens returned' })
  async verify2fa(@Body() body: { userId: string; code: string }) {
    return this.authService.verify2fa(body.userId, body.code);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens using refresh token' })
  @ApiBody({
    schema: {
      properties: {
        refreshToken: { type: 'string' },
      },
      required: ['refreshToken'],
    },
  })
  @ApiOkResponse({ description: 'New access and refresh tokens returned' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
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

  @UseGuards(JwtGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current JWT session (client should forget token)' })
  @ApiOkResponse({ description: 'Logout event logged' })
  async logout(@Req() req: Request) {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    return this.authService.logout(userId);
  }

  @UseGuards(JwtGuard)
  @Post('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout all sessions for current user (stateless JWT)' })
  @ApiOkResponse({ description: 'Logout-all event logged' })
  async logoutAll(@Req() req: Request) {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    return this.authService.logoutAll(userId);
  }
}
