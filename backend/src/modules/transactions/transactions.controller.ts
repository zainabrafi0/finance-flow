import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DeleteTransactionDto } from './dto/delete-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import 'multer';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Record a new income, expense, or transfer transaction',
  })
  create(@CurrentUser() user: any, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated and filtered transactions' })
  @ApiQuery({ name: 'walletId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: any,
    @Query('walletId') walletId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.findAllByUser(user.userId, {
      walletId,
      categoryId,
      category,
      search,
      startDate,
      endDate,
      skip,
      limit,
    });
  }

  @Get('wallet/:walletId')
  @ApiOperation({ summary: 'Get all transactions for a specific wallet' })
  findByWallet(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.transactionsService.findAllByUser(user.userId, { walletId });
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Edit transaction category or description after password confirmation',
  })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Delete a transaction after password confirmation and reverse the wallet balance impact',
  })
  remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: DeleteTransactionDto,
  ) {
    return this.transactionsService.remove(user.userId, id, dto.password);
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'Upload a receipt image for a transaction' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadReceipt(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.transactionsService.uploadReceipt(user.userId, id, file);
  }
}
