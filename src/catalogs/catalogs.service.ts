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

    // Si había URL de imagen o PDF, intentamos borrarlos de Storage.
    // Asumiremos que las URLs guardadas son los "paths" dentro del bucket, 
    // o que podemos extraer el path a partir de la URL.
    // Ejemplo: 'catalogs_files/imagen.png'
    
    const filesToRemove: string[] = [];
    if (catalog.imageUrl) {
      const imagePath = this.extractStoragePath(catalog.imageUrl);
      if (imagePath) filesToRemove.push(imagePath);
    }
    if (catalog.pdfUrl) {
      const pdfPath = this.extractStoragePath(catalog.pdfUrl);
      if (pdfPath) filesToRemove.push(pdfPath);
    }

    if (filesToRemove.length > 0) {
      // Reemplaza 'tu_bucket' por el nombre real de tu bucket en Supabase
      const { error: storageError } = await supabase
        .storage
        .from('catalogs_bucket')
        .remove(filesToRemove);
      
      if (storageError) {
        // Podrías loguear esto, ya que el DB row se borró pero falló el borrado de archivos
        console.error('Error al borrar archivos de Storage:', storageError.message);
      }
    }

    return { message: `Catálogo con ID ${id} eliminado correctamente` };
  }

  /**
   * Helper para extraer el path interno del archivo si guardaste una URL completa.
   * Dependerá de cómo guardes la URL en createCatalogDto.
   * Si guardas el path directo, puedes simplemente retornar la url.
   */
  private extractStoragePath(url: string): string | null {
    // Si la URL es completa de Supabase, podemos buscar la parte final
    // Ejemplo de URL: https://xyz.supabase.co/storage/v1/object/public/catalogs_bucket/carpeta/archivo.png
    if (url.includes('/storage/v1/object/public/')) {
      const parts = url.split('/storage/v1/object/public/catalogs_bucket/');
      return parts.length > 1 ? parts[1] : null;
    }
    return url; // Si ya es un path relativo
  }
}
