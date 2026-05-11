const { Client } = require('pg');
const fs = require('fs');

const PASSWORD = 'zEcpyh-7ryvzu-jinjir';
const REF = 'auushbzgsjxyulkchwae';

const configs = [
  // Standard pooler format for newer Supabase projects
  { name: 'session pooler us-east-1', connectionString: `postgresql://postgres.${REF}:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` },
  { name: 'session pooler us-east-2', connectionString: `postgresql://postgres.${REF}:${PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres` },
  { name: 'tx pooler us-east-1', connectionString: `postgresql://postgres.${REF}:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres` },
  // Old format as fallback
  { name: 'plain postgres us-east-1', connectionString: `postgresql://postgres:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` },
  { name: 'ref-as-user us-east-1', connectionString: `postgresql://${REF}:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` },
];

async function tryConnect(cfg) {
  const client = new Client({ 
    connectionString: cfg.connectionString, 
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    return { success: true, client };
  } catch (err) {
    try { await client.end(); } catch (_) {}
    return { success: false, error: err.message.slice(0, 120) };
  }
}

async function main() {
  for (const cfg of configs) {
    process.stdout.write(`${cfg.name.padEnd(35)}... `);
    const result = await tryConnect(cfg);
    if (result.success) {
      console.log('✅ CONNECTED!');
      const test = await result.client.query('SELECT version()');
      console.log(`   ${test.rows[0].version.slice(0, 80)}`);

      // Read and run migration
      const sql = fs.readFileSync('supabase/migrations/001_schema.sql', 'utf-8');
      console.log(`\n🔄 Applying migration (${(sql.length / 1024).toFixed(1)} KB)...`);
      
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
      let ok = 0, err = 0;
      
      for (const stmt of statements) {
        try {
          await result.client.query(stmt + ';');
          ok++;
        } catch (e) {
          if (e.message.includes('already exists')) { ok++; continue; }
          console.error(`   ❌ ${e.message.slice(0, 120)}`);
          err++;
        }
      }
      
      console.log(`   ✅ ${ok} statements executed, ${err} errors`);
      
      // List tables
      const tables = await result.client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      console.log(`\n📊 ${tables.rows.length} tables in database:`);
      tables.rows.forEach(r => console.log(`   - ${r.table_name}`));

      await result.client.end();
      console.log('\n✅ Database is ready!');
      return;
    }
    console.log(`❌ ${result.error}`);
  }

  console.log('\n❌ Could not connect. Try pasting the SQL directly:');
  console.log('   https://supabase.com/dashboard/project/auushbzgsjxyulkchwae/sql/new');
  console.log('   File: supabase/migrations/001_schema.sql');
}

main().catch(console.error);
