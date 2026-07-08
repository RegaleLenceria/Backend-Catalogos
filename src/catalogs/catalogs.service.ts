import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CatalogsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createCatalogDto: CreateCatalogDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('catalogs')
      .insert([createCatalogDto])
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async findAll() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('catalogs')
      .select('*')
      .eq('isActive', true); // o is_active dependiendo de cómo lo nombres en BD

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('catalogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException(`Catálogo con ID ${id} no encontrado`);
    }
    return data;
  }

  async update(id: string, updateCatalogDto: UpdateCatalogDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('catalogs')
      .update(updateCatalogDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getClient();
    
    // Primero obtenemos el catálogo para saber qué archivos borrar
    const catalog = await this.findOne(id);

    // Borramos de la base de datos
    const { error: dbError } = await supabase
      .from('catalogs')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new InternalServerErrorException(dbError.message);
    }

    const fs = require('fs');
    const path = require('path');

    const deleteLocalFile = (url: string) => {
      if (!url) return;
      try {
        // Extraer el nombre del archivo de la URL
        // Ejemplo de URL: http://localhost:3001/uploads/archivo.png
        const parts = url.split('/uploads/');
        if (parts.length > 1) {
          const fileName = parts[1];
          const filePath = path.join(process.cwd(), 'uploads', fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (err) {
        console.error('Error al borrar archivo local:', err);
      }
    };

    if (catalog.imageUrl) deleteLocalFile(catalog.imageUrl);
    if (catalog.pdfUrl) deleteLocalFile(catalog.pdfUrl);

    return { message: `Catálogo con ID ${id} eliminado correctamente` };
  }

  uploadLocalFile(file: Express.Multer.File, req: any) {
    const host = req.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;
    return { url: fileUrl };
  }
}
