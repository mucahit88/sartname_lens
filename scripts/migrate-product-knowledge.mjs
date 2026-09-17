import fs from "node:fs/promises";
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = await fs.readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try { await client.query("begin"); await client.query(sql); await client.query("commit"); console.log("Product Knowledge migration completed."); }
catch (error) { await client.query("rollback"); throw error; }
finally { await client.end(); }
