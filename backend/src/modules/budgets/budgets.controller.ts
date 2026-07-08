import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  createOrUpdate(@Request() req, @Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.createOrUpdate(req.user.userId, createBudgetDto);
  }

  @Get('progress')
  getProgress(
    @Request() req,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.budgetsService.getBudgetProgress(
      req.user.userId,
      month,
      parseInt(year),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific budget' })
  deleteBudget(@Request() req, @Param('id') id: string) {
    return this.budgetsService.deleteBudget(req.user.userId, id);
  }
}
