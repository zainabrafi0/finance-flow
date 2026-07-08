import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Audit Logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve activity logs for the current user' })
  async getMyLogs(
    @CurrentUser() user: any,
    @Query('limit') limit = 50,
    @Query('skip') skip = 0,
  ) {
    return this.auditService.findAllByUser(
      user.userId,
      Number(limit),
      Number(skip),
    );
  }
}
