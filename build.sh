#!/bin/bash
# Build the frontend and prepare for deployment
set -e

echo "Installing frontend dependencies..."
cd frontend
npm install --production=false
echo "Building frontend..."
npx vite build
cd ..

echo "Build complete. Static files in static/"
