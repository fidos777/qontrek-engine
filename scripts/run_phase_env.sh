#!/usr/bin/env bash
set -euo pipefail

# Export environment required by phase automation commands.
export SUPABASE_URL="https://gbqirfivttuemiyxzaqo.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_TENANT_ID="${SUPABASE_TENANT_ID:-00000000-0000-0000-0000-000000000000}"
export WHATCHIMP_API_TOKEN="13289%7CpF0XfD1bx1KbQvQSN8dYiJPbnXj5kXBhxBaZCsbG8e7a86e3"
export WHATCHIMP_PHONE_ID="775840838934449"
export WHATCHIMP_TEMPLATE_ID="220934"

exec "$@"
