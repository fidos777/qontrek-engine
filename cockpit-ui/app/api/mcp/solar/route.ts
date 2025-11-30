// ======================================================
// SOLAR MCP API ROUTE — Edge Runtime
// Path: /app/api/mcp/solar/route.ts
// Actions: kpi, critical_leads, recovery_pipeline, timeline
// ======================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// ---------------------------------------------
// Supabase (Edge)
// ---------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ---------------------------------------------
// ZOD SCHEMAS (Discriminated Union)
// ---------------------------------------------
const KpiAction = z.object({
  action: z.literal('kpi'),
  params: z.object({}).optional(),
});

const CriticalLeadsAction = z.object({
  action: z.literal('critical_leads'),
  params: z.object({
    stage: z.string().optional(),
    limit: z.number().optional(),
  }).optional(),
});

const RecoveryPipelineAction = z.object({
  action: z.literal('recovery_pipeline'),
  params: z.object({
    stage: z.string().optional(),
    state: z.string().optional(),
    limit: z.number().optional(),
  }).optional(),
});

const TimelineAction = z.object({
  action: z.literal('timeline'),
  params: z.object({
    project_no: z.string(),
  }),
});

const ActionSchema = z.discriminatedUnion('action', [
  KpiAction,
  CriticalLeadsAction,
  RecoveryPipelineAction,
  TimelineAction,
]);

// ---------------------------------------------
// POST HANDLER
// ---------------------------------------------
export async function POST(req: NextRequest) {
  const start = Date.now();

  let parsed;
  try {
    const body = await req.json();
    parsed = ActionSchema.parse(body);
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: 'Validation error',
      details: err.errors ?? err.message,
    }, { status: 400 });
  }

  const { action, params } = parsed;

  try {
    // ---------------------------------------------
    // KPI
    // ---------------------------------------------
    if (action === 'kpi') {
      const { data, error } = await supabase
        .from('v_solar_kpi_summary')
        .select('*');

      if (error) throw error;

      return NextResponse.json({
        success: true,
        action,
        data,
        meta: { ms: Date.now() - start },
      });
    }

    // ---------------------------------------------
    // CRITICAL LEADS
    // ---------------------------------------------
    if (action === 'critical_leads') {
      let q = supabase.from('v_critical_leads').select('*');

      if (params?.stage) q = q.eq('stage', params.stage);
      if (params?.limit) q = q.limit(params.limit);

      const { data, error } = await q;
      if (error) throw error;

      return NextResponse.json({
        success: true,
        action,
        data,
        meta: { ms: Date.now() - start },
      });
    }

    // ---------------------------------------------
    // RECOVERY PIPELINE
    // ---------------------------------------------
    if (action === 'recovery_pipeline') {
      let q = supabase.from('v_payment_recovery_pipeline').select('*');

      if (params?.stage) q = q.eq('stage', params.stage);
      if (params?.state) q = q.eq('state', params.state);
      if (params?.limit) q = q.limit(params.limit);

      const { data, error } = await q;
      if (error) throw error;

      return NextResponse.json({
        success: true,
        action,
        data,
        meta: { ms: Date.now() - start },
      });
    }

    // ---------------------------------------------
    // TIMELINE (project_no)
    // ---------------------------------------------
    if (action === 'timeline') {
      const { project_no } = params!;

      const { data, error } = await supabase
        .from('v_solar_timeline')
        .select('*')
        .eq('project_no', project_no)
        .order('event_date', { ascending: true });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        action,
        data,
        meta: { ms: Date.now() - start },
      });
    }

    // fallback (should never hit)
    return NextResponse.json({
      success: false,
      error: 'Unknown action',
    }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      meta: { ms: Date.now() - start },
    }, { status: 500 });
  }
}

// ---------------------------------------------
// GET HANDLER (health check)
// ---------------------------------------------
export async function GET() {
  return NextResponse.json({
    success: true,
    runtime: 'edge',
    actions: ['kpi', 'critical_leads', 'recovery_pipeline', 'timeline'],
  });
}
