// Script to run SQL migrations against Supabase using the REST API
// Uses the service role key via direct HTTP to the pg proxy endpoint

const SUPABASE_URL = 'https://wmdowcsxtudwrovdeqnx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZG93Y3N4dHVkd3JvdmRlcW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjIxMDQsImV4cCI6MjA5NDQzODEwNH0.NGNCLjVXz7UrbN7EL1PNJb0QOT5J18Fd7CtOe5PHIRo';

// We'll run each statement individually via rpc if available,
// or inform user to use the dashboard.

const statements = [
  {
    label: 'Create notifications table',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        recipient_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    label: 'Enable RLS on notifications',
    sql: `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`
  },
  {
    label: 'Create notifications SELECT policy',
    sql: `CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid()::text = recipient_email);`
  },
  {
    label: 'Create notifications UPDATE policy',
    sql: `CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid()::text = recipient_email);`
  },
  {
    label: 'Create notifications INSERT policy',
    sql: `CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');`
  },
  {
    label: 'Create presence SELECT policy',
    sql: `CREATE POLICY "Public can read presence" ON presence FOR SELECT USING (auth.role() = 'authenticated');`
  },
  {
    label: 'Create presence INSERT policy',
    sql: `CREATE POLICY "Users can insert their own presence" ON presence FOR INSERT WITH CHECK (auth.uid()::text = user_email);`
  },
  {
    label: 'Create presence UPDATE policy',
    sql: `CREATE POLICY "Users can update their own presence" ON presence FOR UPDATE USING (auth.uid()::text = user_email);`
  }
];

async function runStatement(label, sql) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });
    
    const text = await res.text();
    if (res.ok) {
      console.log(`✅ ${label}`);
    } else {
      console.log(`⚠️  ${label}: ${text}`);
    }
  } catch (err) {
    console.error(`❌ ${label}: ${err.message}`);
  }
}

async function main() {
  console.log('🚀 Running SQL migrations via Supabase REST API...\n');
  
  for (const { label, sql } of statements) {
    await runStatement(label, sql.trim());
  }
  
  console.log('\n✨ Done! Check results above.');
  console.log('\nIf you see ⚠️ errors about "exec_sql not found", please run the SQL script manually at:');
  console.log(`https://supabase.com/dashboard/project/wmdowcsxtudwrovdeqnx/sql/new`);
}

main();
