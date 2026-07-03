import { Module } from '@nestjs/common';
import { ContactInfoService } from './contact-info.service';
import { ContactInfoController } from './contact-info.controller';

@Module({
  providers: [ContactInfoService],
  controllers: [ContactInfoController]
})
export class ContactInfoModule {}
