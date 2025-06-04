#!/bin/bash

echo "🧹 Cleaning up Next.js build artifacts..."

# Remove .next directory
rm -rf .next

# Remove node_modules/.cache if it exists
rm -rf node_modules/.cache

# Remove any potential Sentry cache
rm -rf .sentryclirc

# Clear npm cache
npm cache clean --force

echo "✅ Build cleanup complete!"
echo "Now run: npm run build"