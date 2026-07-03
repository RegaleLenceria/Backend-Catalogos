import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ContactInfoService } from './contact-info.service';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contact-info')
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  @Get()
  getContactInfo() {
    return this.contactInfoService.getContactInfo();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  updateContactInfo(@Body() updateContactInfoDto: UpdateContactInfoDto) {
    return this.contactInfoService.updateContactInfo(updateContactInfoDto);
  }
}
