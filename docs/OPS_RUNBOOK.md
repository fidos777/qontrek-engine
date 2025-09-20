# Qontrek Multi-Tenant WhatsApp Ops Integration Runbook

## Step 1 – DB Migrations (Batch A+B)
| Step | Action | Acceptance (DoD) | Risks & Fix |
| --- | --- | --- | --- |
| 1 | Jalankan migrations 001–005, seed `brand_config` untuk Voltek & Perodua, dan sahkan index + RLS aktif. | `set_config('app.brand', ...)` mengasingkan data, `vw_unmetered_24h` mengembalikan rekod tepat, `ops_logs` mencatat kemas kini. | Lupa set `app.brand` → kueri kosong. Tambah peringatan jelas dalam README / demo steps. |

## Step 2 – Flow B (Send+Meter)
| Step | Action | Acceptance (DoD) | Risks & Fix |
| --- | --- | --- | --- |
| 2 | Import `flows/send_meter.json`, letak helper JS (`payload_builder.js`, `resolve_locale.js`, `phone_check.js`, `status_check.js`) dan `sql/ops_log_insert.sql`. | Payload duplikat tak gandakan insert, nombor/locale tak sah → `held`, 429/5xx retry 3× (2/4/8s), semua outcome tulis ke `ops_logs`. | Tentukan satu sumber validasi nombor (disaran guna fungsi JS) supaya hasil konsisten. |

## Step 3 – Pytest Suite
| Step | Action | Acceptance (DoD) | Risks & Fix |
| --- | --- | --- | --- |
| 3 | Jalankan `pytest -q` untuk semak idempotency, retry policy, policy blocks, dan monitor view. | Semua ujian hijau, seed `brand_config` mengandungi ≥1 baris. | Jika gagal, semak seed tenant & konfigurasi RLS Supabase. |

## Step 4 – ROI Nudge + Monitor + Referral
| Step | Action | Acceptance (DoD) | Risks & Fix |
| --- | --- | --- | --- |
| 4 | Import `roi_nudge.json`, `monitor.json`, `referral.json`; uji opt-out, cooldown, referral cap & Slack alert. | Nudge ke-2 <72h → `held(cooldown)`, STOP/BATAL → `held(optout)`, referral dua kali → 1 baris, melebihi cap → `held(reward_cap)`, alert Slack untuk mismatch/unmetered. | Pastikan peraturan reward cap didokumentasi & Slack webhook guna URL sebenar. |

## Step 5 – Preflight + Makefile
| Step | Action | Acceptance (DoD) | Risks & Fix |
| --- | --- | --- | --- |
| 5 | Jalankan `make preflight` dan `make run-demo` untuk Voltek & Perodua. | Preflight hijau, demo mengesahkan pemisahan tenant. | Sediakan aset dummy (contoh stub flow) jika ada skrip bergantung pada fail yang belum tersedia. |

## Step 6 – Metabase SQL Pack
| Step | Action | Acceptance (DoD) | Risks & Fix |
| --- | --- | --- | --- |
| 6 | Import `sent_vs_metered.sql`, `acceptance.sql`, `template_ranking.sql`, dan `unmetered_watch.sql`. | Dashboard menunjukkan kebocoran meter = 0, acceptance ratio hanya `ok=true`. | Terangkan bahawa penapis brand adalah pilihan supaya penganalisis tahu cara scoped queries. |

## Step 7 – README Demo Guide
| Step | Action | Acceptance (DoD) | Risks & Fix |
| --- | --- | --- | --- |
| 7 | Ikut README: preflight → `make run-demo` → import SQL & flow → lakukan ujian negatif. | Jurutera baharu mampu ulang demo <30 min dengan Voltek & Perodua. | Kemas kini README jika ada langkah baru supaya onboarding tak ketinggalan. |

## Timeline (Anggaran)
- DB Migrations: 20–30 min
- Flow B Import + JS patch: 30–40 min
- Pytest: 15–20 min
- ROI Nudge + Monitor + Referral: 30–40 min
- Preflight + Makefile: 15–20 min
- Metabase SQL: ~15 min
- README Demo run: 20–25 min
- **Jumlah:** ±2–3 jam bergantung pada akses Supabase & n8n.
