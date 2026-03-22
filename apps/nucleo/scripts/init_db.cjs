const { Client } = require('pg');
const fs = require('fs');

async function initDb() {
    const client = new Client({
        connectionString: "postgresql://postgres:wihvin-dekQu7-jepjut@db.hdhamxiblwwskvvqbcfo.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        console.log("Connected to Supabase DB via pg.");

        const schemaSql = fs.readFileSync('./supabase/schema.sql', 'utf8');
        await client.query(schemaSql);
        console.log("Schema applied successfully.");

    } catch (err) {
        console.error("Error applying schema:", err);
    } finally {
        await client.end();
    }
}

initDb();
