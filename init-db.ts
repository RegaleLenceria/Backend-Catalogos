import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log('Table "users" ensured.');

    // Create catalogs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.catalogs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        "imageUrl" text,
        "pdfUrl" text,
        "isActive" boolean DEFAULT true,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log('Table "catalogs" ensured.');

    // Create contact_info table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.contact_info (
        id serial PRIMARY KEY,
        address text,
        phone text,
        schedule_weekdays text,
        schedule_saturdays text,
        schedule_sundays text,
        advisors jsonb
      );
    `);
    console.log('Table "contact_info" ensured.');

    // Check if contact_info id 1 exists
    const contactRes = await client.query('SELECT id FROM public.contact_info WHERE id = 1');
    if (contactRes.rows.length === 0) {
      await client.query(`
        INSERT INTO public.contact_info (id, address, phone, schedule_weekdays, schedule_saturdays, schedule_sundays, advisors)
        VALUES (
          1,
          'Segundo Anillo & Fidel Oliva, Santa Cruz de la Sierra',
          '+591 75026806',
          '10:00 - 18:30 (horario continuo)',
          '9:00 - 13:00 (horario continuo)',
          'Cerrado',
          '[
            {"name": "Carla", "phone": "59178555506", "message": "Hola Carla, vengo de los catálogos estoy interesada en.."},
            {"name": "Andrea", "phone": "59169639272", "message": "Hola Andrea, vengo de los catálogos estoy interesada en.."},
            {"name": "Maria Eugenia", "phone": "59176563151", "message": "Hola Maria Eugenia, vengo de los catálogos estoy interesada en.."},
            {"name": "Jacquelin", "phone": "59175026806", "message": "Hola Jacquelin, vengo de los catálogos estoy interesada en.."}
          ]'::jsonb
        )
      `);
      console.log('Default contact_info inserted.');
    }

    
    // Check if admin exists
    const res = await client.query('SELECT id FROM public.users WHERE email = $1', ['admin']);
    if (res.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('adminregale', salt);
      await client.query('INSERT INTO public.users (email, password) VALUES ($1, $2)', ['admin', hash]);
      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }

    // Check if sistemas user exists
    const resSistemas = await client.query('SELECT id FROM public.users WHERE email = $1', ['sistemas@regalelenceria.com']);
    if (resSistemas.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('sistemas_2242026', salt);
      await client.query('INSERT INTO public.users (email, password) VALUES ($1, $2)', ['sistemas@regalelenceria.com', hash]);
      console.log('Sistemas user created successfully.');
    } else {
      console.log('Sistemas user already exists.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
