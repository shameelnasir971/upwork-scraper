import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL || "https://zpgcldllammzlxkktpfv.supabase.co", 
  process.env.SUPABASE_KEY || "sb_publishable_GT0CtQWcAdRGNfGGPd5GVg_zubsqSyy"
)

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get Expiry Setting
        const { data: settings } = await supabase.from('settings').select('expiry_minutes').eq('id', 1).single();
        const expiryMins = settings?.expiry_minutes || 360;

        // 2. Server-side Cleanup (UTC Based)
        const cutoffTime = new Date(Date.now() - expiryMins * 60 * 1000).toISOString();
        
        // Delete jobs older than cutoff
        await supabase.from('jobs').delete().lt('created_at', cutoffTime);

        // 3. Fetch Fresh Jobs
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error; 
        return NextResponse.json(jobs, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await supabase.from('jobs').delete().eq('job_id', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}