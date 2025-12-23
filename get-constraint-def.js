import pg from "pg";

const { Pool } = pg;

async function getConstraintDef() {
  const pool = new Pool({
    host: process.env.DB_HOST || "13.204.19.175",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "steelapp",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "R8kPz!2vAq#9LmT4eX7wB$hQ",
    ssl: process.env.DB_SSL === "true" ? true : false,
  });

  try {
    console.log(
      "=== Getting constraint definition for chk_invoice_status ===\n",
    );

    const result = await pool.query(`
      SELECT pg_get_constraintdef('chk_invoice_status'::regclass) as constraint_def
    `);

    console.log("Constraint Definition:");
    console.log(result.rows[0]?.constraint_def || "NOT FOUND");
    console.log("");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

getConstraintDef().catch(console.error);
