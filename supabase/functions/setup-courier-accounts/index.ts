import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Courier {
  id: string;
  name: string;
  phone: string;
  user_id: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify caller is superadmin or manager
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header majburiy' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Autentifikatsiya xatosi' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check caller's role
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .in('role', ['superadmin', 'manager'])
      .maybeSingle();

    if (!callerRole) {
      console.log(`Unauthorized access attempt by user: ${caller.id}`);
      return new Response(
        JSON.stringify({ error: 'Bu amalni bajarish uchun ruxsatingiz yo\'q' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authorized user ${caller.id} with role ${callerRole.role} initiating courier setup`);

    // Get request body
    const { defaultPassword } = await req.json();
    
    if (!defaultPassword || defaultPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting courier account setup...');

    // Fetch all couriers without user_id
    const { data: couriers, error: fetchError } = await supabaseAdmin
      .from('couriers')
      .select('id, name, phone, user_id')
      .is('user_id', null)
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching couriers:', fetchError);
      throw fetchError;
    }

    if (!couriers || couriers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Bog\'lanmagan kuryerlar topilmadi',
          created: 0,
          errors: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${couriers.length} couriers without accounts`);

    const results = {
      created: 0,
      errors: [] as string[],
    };

    for (const courier of couriers as Courier[]) {
      try {
        // Create email from phone number
        const email = `courier_${courier.phone.replace(/\+/g, '')}@bellavista.local`;
        
        console.log(`Creating account for courier: ${courier.name} (${email})`);

        // Create user account
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            full_name: courier.name,
            phone: courier.phone,
            role: 'courier',
          },
        });

        if (authError) {
          // Check if user already exists
          if (authError.message.includes('already been registered')) {
            // Try to find existing user
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email === email);
            
            if (existingUser) {
              // Link existing user to courier
              const { error: updateError } = await supabaseAdmin
                .from('couriers')
                .update({ user_id: existingUser.id })
                .eq('id', courier.id);

              if (updateError) {
                throw updateError;
              }

              // Ensure courier role exists
              const { error: roleError } = await supabaseAdmin
                .from('user_roles')
                .upsert({ user_id: existingUser.id, role: 'courier' }, { onConflict: 'user_id,role' });

              if (roleError && !roleError.message.includes('duplicate')) {
                console.warn('Role assignment warning:', roleError);
              }

              results.created++;
              console.log(`Linked existing user to courier: ${courier.name}`);
              continue;
            }
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error('User creation failed - no user returned');
        }

        const userId = authData.user.id;

        // Assign courier role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: 'courier' });

        if (roleError && !roleError.message.includes('duplicate')) {
          console.warn('Role assignment warning:', roleError);
        }

        // Link user to courier
        const { error: linkError } = await supabaseAdmin
          .from('couriers')
          .update({ user_id: userId })
          .eq('id', courier.id);

        if (linkError) {
          throw linkError;
        }

        results.created++;
        console.log(`Successfully created account for courier: ${courier.name}`);

      } catch (error) {
        const errorMessage = `${courier.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMessage);
        console.error(`Error processing courier ${courier.name}:`, error);
      }
    }

    const message = results.created > 0 
      ? `${results.created} ta kuryer hisobi yaratildi`
      : 'Hech qanday hisob yaratilmadi';

    console.log('Setup complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message,
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
