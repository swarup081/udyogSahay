const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSites() {
  const { data, error } = await supabase
    .from('websites')
    .select('id, site_slug, is_published, template:templates(name), created_at, user_id')
    .order('created_at', { ascending: false });

  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkSites();
