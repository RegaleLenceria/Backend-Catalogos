import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';

@Injectable()
export class ContactInfoService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getContactInfo() {
    const supabase = this.supabaseService.getClient();
    // Suponemos que siempre hay un solo registro con id = 1
    const { data, error } = await supabase
      .from('contact_info')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Información de contacto no encontrada. Por favor, asegúrate de que el registro con id=1 exista en la base de datos.');
      }
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async updateContactInfo(updateContactInfoDto: UpdateContactInfoDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('contact_info')
      .update(updateContactInfoDto)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }
}
