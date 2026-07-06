import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'admin';
  const passwordPlain = 'adminregale';
  
  try {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(passwordPlain, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        console.log('User admin already exists.');
      } else {
        console.error('Error creating admin user:', error);
      }
    } else {
      console.log('Admin user created successfully:', data);
    }
  } catch (err) {
    console.error('Exception during admin user creation:', err);
  }
}

main();
