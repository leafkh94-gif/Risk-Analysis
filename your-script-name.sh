#!/usr/bin/env bash
# Copies index.html into public/ so Vercel finds it regardless of
# whether the output directory is set to "." or "public" in the dashboard.
set -e
mkdir -p public
cp index.html public/index.html
echo "Build complete: public/index.html ready."
