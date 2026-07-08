import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SavingsService } from './savings.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { AddFundsDto } from './dto/add-funds.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Post()
  create(@Request() req, @Body() createGoalDto: CreateGoalDto) {
    return this.savingsService.create(req.user.userId, createGoalDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.savingsService.findAll(req.user.userId);
  }

  @Post(':id/add-funds')
  addFunds(
    @Request() req,
    @Param('id') goalId: string,
    @Body() addFundsDto: AddFundsDto,
  ) {
    return this.savingsService.addFunds(req.user.userId, goalId, addFundsDto);
  }
}
