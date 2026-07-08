import { PartialType } from '@nestjs/swagger';
import { CreateWalletDto } from './create-wallet.dto';

// PartialType automatically makes all properties from CreateWalletDto optional
export class UpdateWalletDto extends PartialType(CreateWalletDto) {}
