// /api/seed/invoices.ts
import postgres from 'postgres';
import { invoices } from '@/app/lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

export async function GET() {
  try {
    await seedInvoices();
    return Response.json({ message: 'Invoices seeded successfully' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Seeding error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  
    // fallback for non-Error types
    return Response.json({ error: 'Unknown error occurred' }, { status: 500 });
  }
}
