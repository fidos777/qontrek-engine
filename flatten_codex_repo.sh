#!/bin/bash
set -e
echo "🧹 Cleaning nested repo structure..."

cd voltek-prompts || { echo "❌ 'voltek-prompts' not found"; exit 1; }
rsync -av --ignore-existing . ../
cd ..
mv .git .git_backup
rm -rf voltek-prompts
git init
git remote add origin https://github.com/fidos777/voltek-prompts.git
git checkout -b main
echo "✅ Repo cleaned. Run: git add . && git commit -m 'Flattened repo' && git push -f origin main"

