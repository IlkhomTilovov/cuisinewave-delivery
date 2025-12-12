import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify caller is authenticated and is superadmin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Autentifikatsiya talab qilinadi" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      console.error("Invalid token:", authError);
      return new Response(
        JSON.stringify({ error: "Yaroqsiz token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller has superadmin role
    const { data: callerRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .single();

    if (roleError || callerRole?.role !== 'superadmin') {
      console.error("Caller is not superadmin:", callerUser.id, callerRole?.role);
      return new Response(
        JSON.stringify({ error: "Faqat superadmin foydalanuvchi yaratishi mumkin" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, fullName, role } = await req.json();

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email va parol kiritilishi shart" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validRoles = ['superadmin', 'manager', 'operator', 'courier'];
    if (role && !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Noto'g'ri rol" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || null
      }
    });

    if (createUserError) {
      console.error("Auth error:", createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: "Foydalanuvchi yaratilmadi" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: fullName || null
      });

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    // Add role
    const { error: addRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role || 'operator'
      });

    if (addRoleError) {
      console.error("Role error:", addRoleError);
      return new Response(
        JSON.stringify({ error: "Rol qo'shishda xatolik: " + addRoleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User created successfully: ${email} with role ${role || 'operator'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Foydalanuvchi muvaffaqiyatli yaratildi",
        user_id: authData.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Noma'lum xatolik";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
