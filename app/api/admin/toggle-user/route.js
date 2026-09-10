import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, isActive } = await request.json();

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    // Service role client — inapita RLS kabisa
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Direct update — service role inapita RLS
    const { data, error } = await admin
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select('id, is_active')
      .single();

    if (error) {
      console.error('[toggle-user] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isActive: data.is_active });

  } catch (err) {
    console.error('[toggle-user] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
