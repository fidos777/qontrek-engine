#!/bin/bash
clear
echo "🔍 Tower Proof Log Monitor"
echo "==========================="
tail -f logs/plan.log | sed \
  -e 's/🚀/🔥/g' \
  -e 's/✅/🟢/g' \
  -e 's/⚙️/🟡/g' \
  -e 's/❌/🔴/g'

