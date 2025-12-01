#!/bin/bash
# Voltek Demo - Quick Setup Script
# Run this to initialize the project

echo "🚀 Setting up Voltek Payment Recovery Demo..."

# Create Next.js project
echo "📦 Creating Next.js project..."
npx create-next-app@latest voltek-demo \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm

cd voltek-demo

# Install dependencies
echo "📥 Installing dependencies..."
npm install lucide-react class-variance-authority clsx tailwind-merge

# Create directory structure
echo "📁 Creating project structure..."
mkdir -p app/demo/g2
mkdir -p components/ui
mkdir -p components/voltek
mkdir -p lib
mkdir -p public/data
mkdir -p public/assets
mkdir -p config

# Copy proof data (you'll need to do this manually)
echo "📄 Copy your proof file:"
echo "   cp /path/to/proof/g2_dashboard_v19.1.json public/data/"

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. cd voltek-demo"
echo "   2. Copy all component files from the package"
echo "   3. Copy proof JSON to public/data/"
echo "   4. npm run dev"
echo "   5. Open http://localhost:3000/demo/g2"
