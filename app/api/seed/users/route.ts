import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { users } from '@/app/lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedUsers() {
  // Create the uuid-ossp extension (if it doesn't already exist)
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // Create the users table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  // Insert users into the table
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

export async function GET() {
  try {
    await seedUsers();
    return new Response(
      JSON.stringify({ message: 'Users seeded successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) { // Explicitly typing error as `unknown`
    if (error instanceof Error) { // Narrowing the error type
      return new Response(
        JSON.stringify({ error: 'Error seeding users', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Fallback if the error is not an instance of Error
      return new Response(
        JSON.stringify({ error: 'Unknown error occurred' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}
