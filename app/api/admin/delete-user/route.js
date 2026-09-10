import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Thibitisha — hakuna active au pending loans
    const { data: loans } = await admin
      .from('loans')
      .select('id, status')
      .eq('user_id', userId);

    const hasActive = (loans || []).some(l =>
      l.status === 'active' || l.status === 'pending'
    );

    if (hasActive) {
      return NextResponse.json({
        error: 'Cannot delete user with active or pending loans.'
      }, { status: 400 });
    }

    // 2. Futa guarantors za user huyu
    await admin.from('guarantors').delete().eq('user_id', userId);

    // 3. Futa loans za user huyu (completed/rejected tu)
    await admin.from('loans').delete().eq('user_id', userId);

    // 4. Futa profile
    await admin.from('profiles').delete().eq('id', userId);

    // 5. Futa kutoka Supabase Auth
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[delete-user] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
