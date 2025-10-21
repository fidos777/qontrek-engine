#!/bin/bash
MAX_SIZE_MB=90
REPO_SIZE=$(git count-objects -vH | grep "size-pack" | awk '{print $2}' | sed 's/[^0-9.]//g')

if (( $(echo "$REPO_SIZE > $MAX_SIZE_MB" | bc -l) )); then
  echo "🚨 Repo pack size exceeds ${MAX_SIZE_MB} MB ($REPO_SIZE MB). Clean before push!"
  exit 1
else
  echo "✅ Repo size healthy ($REPO_SIZE MB). Proceeding with push..."
fi

