import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL || "https://zpgcldllammzlxkktpfv.supabase.co", 
  process.env.SUPABASE_KEY || "sb_publishable_GT0CtQWcAdRGNfGGPd5GVg_zubsqSyy"
)

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Database se setting uthao (No hardcoded default here)
        const { data: settings } = await supabase.from('settings').select('expiry_minutes').eq('id', 1).single();
        
        // 2. Sirf tab delete karo agar setting mojud ho
        if (settings && settings.expiry_minutes > 0) {
            const expiryMins = settings.expiry_minutes;
            const cutoffTime = new Date(Date.now() - expiryMins * 60 * 1000).toISOString();
            
            console.log(`Deleting jobs older than ${expiryMins} minutes. Cutoff: ${cutoffTime}`);
            
            const { error: delError } = await supabase
                .from('jobs')
                .delete()
                .lt('created_at', cutoffTime);
                
            if (delError) console.error("Auto-delete error:", delError);
        }

        // 3. Fetch Jobs
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