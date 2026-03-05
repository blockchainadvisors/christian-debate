#!/bin/bash
# Fix Next.js 16 Turbopack CSS hash mismatch
# The production build generates CSS files with one hash, but the runtime
# references them with a different hash. This script finds mismatched CSS
# references in the pre-rendered HTML and creates symlinks/copies.

set -e

NEXT_DIR=".next"
STATIC_CHUNKS="$NEXT_DIR/static/chunks"

if [ ! -d "$STATIC_CHUNKS" ]; then
  echo "No .next/static/chunks directory found. Run 'next build' first."
  exit 1
fi

# Get all CSS hashes that exist on disk
DISK_HASHES=$(ls "$STATIC_CHUNKS"/*.css 2>/dev/null | sed 's/.*\///' | sed 's/\.css//')

# Get all CSS hashes referenced in pre-rendered HTML and manifests
REFERENCED_HASHES=$(grep -roh '[a-f0-9]\{16\}\.css' "$NEXT_DIR/server/" 2>/dev/null | sed 's/\.css//' | sort -u)

# Find hashes on disk that aren't referenced
LARGEST_CSS=""
LARGEST_SIZE=0
for hash in $DISK_HASHES; do
  size=$(stat -c%s "$STATIC_CHUNKS/$hash.css" 2>/dev/null || echo 0)
  if [ "$size" -gt "$LARGEST_SIZE" ]; then
    LARGEST_SIZE=$size
    LARGEST_CSS=$hash
  fi
done

if [ -z "$LARGEST_CSS" ]; then
  echo "No CSS files found."
  exit 0
fi

echo "Largest CSS file: $LARGEST_CSS.css ($LARGEST_SIZE bytes)"

# Start the server briefly to discover runtime CSS hash
echo "Discovering runtime CSS hash..."
NODE_OPTIONS="--max-old-space-size=256" npx next start -p 3999 &
SERVER_PID=$!
sleep 4

RUNTIME_HASHES=$(curl -s http://localhost:3999/ 2>/dev/null | grep -oP '[a-f0-9]{16}\.css' | sed 's/\.css//' | sort -u)

kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

for hash in $RUNTIME_HASHES; do
  if [ ! -f "$STATIC_CHUNKS/$hash.css" ]; then
    echo "Missing CSS: $hash.css — copying from $LARGEST_CSS.css"
    cp "$STATIC_CHUNKS/$LARGEST_CSS.css" "$STATIC_CHUNKS/$hash.css"
  fi
done

echo "CSS hash fix complete."
