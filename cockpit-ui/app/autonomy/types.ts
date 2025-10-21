export type TowerChannelMetrics = {
  ack_rate: number;
  latency_p95_ms: number;
};

type RequiredTowerKpis = {
  ack_rate_24h: number;
  alert_action_latency_ms_p95: number;
  dlq_depth: number;
  dlq_replayed_24h: number;
  replay_success_rate: number;
  ntp_offset_ms: number;
  policy_diff_class: string;
  autotune_guard_active: boolean;
};

type OptionalTowerKpis = Partial<{
  ack_rate_24h_slack: number;
  ack_rate_24h_wa: number;
  ack_rate_24h_email: number;
  alert_action_latency_ms_p50: number;
  latency_p95_ms_slack: number;
  latency_p95_ms_wa: number;
  latency_p95_ms_email: number;
  dlq_age_max_h: number;
  replay_batch_max: number;
  replay_time_ms_p95: number;
}>;

export type TowerSummary = {
  generated_at: string;
  cloud_parity_ok?: boolean;
  cloud_parity_checked_at?: string;
  cloud_checked_at?: string;
  kpis: RequiredTowerKpis & OptionalTowerKpis;
  channels?: Record<string, TowerChannelMetrics>;
};
