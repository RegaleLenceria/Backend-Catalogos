import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';
import { CatalogsService } from './catalogs.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';

// Asegurarse de que el directorio existe
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 250 * 1024 * 1024, // 250 MB
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.catalogsService.uploadLocalFile(file, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCatalogDto: CreateCatalogDto) {
    return this.catalogsService.create(createCatalogDto);
  }

  @Get()
  findAll() {
    return this.catalogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCatalogDto: UpdateCatalogDto) {
    return this.catalogsService.update(id, updateCatalogDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalogsService.remove(id);
  }
}
