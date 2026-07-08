import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Protects every route in this controller
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  create(@CurrentUser() user: any, @Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(user.userId, createWalletDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallets for the logged-in user' })
  findAll(@CurrentUser() user: any) {
    return this.walletsService.findAllByUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific wallet by ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.walletsService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific wallet' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.walletsService.update(user.userId, id, updateWalletDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific wallet' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.walletsService.remove(user.userId, id);
  }
}
