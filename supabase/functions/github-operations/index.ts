import { serve } from 'https://deno.fresh.dev/server/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
  try {
    const { operation, ...params } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    switch (operation) {
      case 'create-repo':
        const { name, isPrivate } = params;
        const response = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('GITHUB_ACCESS_TOKEN')}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            private: isPrivate,
            auto_init: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create repository');
        }

        const data = await response.json();
        return new Response(
          JSON.stringify(data),
          { headers: { 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { status: 400 }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});