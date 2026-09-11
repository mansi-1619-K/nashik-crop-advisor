#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start dev server and open browser
echo ""
echo "  Nashik Crop Advisor"
echo "  http://localhost:3000"
echo ""

(npx open-cli http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || true) &
npm run dev
