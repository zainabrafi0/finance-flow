import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Recurring Transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recurring transaction template' })
  create(@CurrentUser() user: any, @Body() dto: CreateRecurringDto) {
    return this.recurringService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all user recurring transactions' })
  findAll(@CurrentUser() user: any) {
    return this.recurringService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific recurring transaction' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recurringService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific recurring transaction parameters' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringDto,
  ) {
    return this.recurringService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a specific recurring transaction template' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recurringService.remove(user.userId, id);
  }
}
