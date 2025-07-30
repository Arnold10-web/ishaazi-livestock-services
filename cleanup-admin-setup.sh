#!/bin/bash

# Cleanup Script - Remove admin creation after first run
# Run this after the admin has been created successfully

echo "🧹 Cleaning up admin creation setup..."

# 1. Add scripts/ back to .gitignore
echo ""
echo "📝 Adding scripts/ to .gitignore..."
cat >> .gitignore << EOF

# Scripts directory (contains sensitive admin creation scripts)
scripts/

EOF

# 2. Remove auto-creation from server.js
echo "🔧 Removing auto-creation from server.js..."
sed -i '/AUTO_CREATE_ADMIN/,/});/d' server.js

echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Commit these changes"
echo "2. Push to GitHub"
echo "3. Railway will redeploy without admin auto-creation"
