#!/bin/bash
# Supabase Migration Runner
# This script pushes all pending migrations to your Supabase project

echo "🚀 Bulletin Board - Database Migration Runner"
echo "================================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📍 Navigating to project directory..."
cd "$(dirname "$0")"

echo "🔗 Linking to Supabase project..."
echo "   Project: wmdowcsxtudwrovdeqnx"
echo ""
echo "⚠️  You will be prompted to enter your Supabase password"
echo "   (This is in your account settings: Settings → API)"
echo ""

supabase link --project-ref wmdowcsxtudwrovdeqnx

echo ""
echo "📤 Pushing migrations to Supabase..."
echo ""

supabase db push

echo ""
echo "✅ Migration complete!"
echo ""
echo "📊 Verifying tables were created..."
supabase db remote show

echo ""
echo "🎉 Database setup done!"
echo ""
echo "Next steps:"
echo "  1. Create storage bucket: See SETUP_GUIDE.md Step 2"
echo "  2. Configure RLS policies: See SETUP_GUIDE.md Step 3"
echo "  3. Test post creation in the app"
