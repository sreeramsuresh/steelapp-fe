import pg from "pg";

const { Pool } = pg;

async function inspectSchema() {
  const pool = new Pool({
    host: process.env.DB_HOST || "13.204.19.175",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "steelapp",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "R8kPz!2vAq#9LmT4eX7wB$hQ",
    ssl: process.env.DB_SSL === "true" ? true : false,
  });

  try {
    const tables = [
      "invoices",
      "companies",
      "customers",
      "products",
      "warehouses",
      "stock",
      "vendors_bills",
      "suppliers",
      "delivery_notes",
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(
          `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `,
          [table],
        );

        if (result.rows.length > 0) {
          console.log(`\n=== TABLE: ${table} ===`);
          console.log(
            result.rows
              .map(
                (r) =>
                  `  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`,
              )
              .join("\n"),
          );
        }
      } catch (e) {
        console.log(`\nTable ${table} not found or error: ${e.message}`);
      }
    }
  } finally {
    await pool.end();
  }
}

inspectSchema().catch(console.error);
