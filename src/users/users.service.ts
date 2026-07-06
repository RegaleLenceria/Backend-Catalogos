import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findByEmail(email: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return data;
  }

  async create(email: string, passwordPlain: string) {
    const supabase = this.supabaseService.getClient();
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(passwordPlain, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
