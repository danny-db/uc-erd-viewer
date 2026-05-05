#!/bin/bash
set -e

# Build frontend if static/ doesn't exist yet
if [ ! -f "static/index.html" ]; then
  echo "Building frontend..."
  cd frontend
  npm install --prefer-offline 2>&1
  npx vite build 2>&1
  cd ..
  echo "Frontend build complete."
else
  echo "Frontend already built, skipping."
fi

# Start the backend
exec uvicorn app:app --host 0.0.0.0 --port 8000
