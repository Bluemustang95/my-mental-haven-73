import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: 'No autenticado' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Sesión inválida' }, 401);

    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'Solo administradores' }, 403);

    let body: { filename?: string; content?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Body inválido' }, 400);
    }

    const content = typeof body.content === 'string' ? body.content : '';
    if (!content || content.length > 8_000_000) return json({ error: 'Contenido inválido' }, 400);
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') throw new Error('bad');
    } catch {
      return json({ error: 'JSON de animación inválido' }, 400);
    }

    const safeName = (body.filename ?? '').replace(/[^a-zA-Z0-9._-]/g, '').slice(-40);
    const path = `lottie-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${safeName ? '-' + safeName : ''}.json`;

    const { error: upErr } = await admin.storage
      .from('lottie-animations')
      .upload(path, new Blob([content], { type: 'application/json' }), {
        contentType: 'application/json',
        upsert: false,
      });
    if (upErr) {
      console.error('lottie upload failed:', upErr.message);
      return json({ error: upErr.message }, 500);
    }

    return json({ path });
  } catch (e) {
    console.error('upload-lottie error:', e);
    return json({ error: e instanceof Error ? e.message : 'Error desconocido' }, 500);
  }
});
