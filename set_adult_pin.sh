#!/bin/bash
# Change the 18+ PIN of Nini TV Pro without rebuilding the app.
# Usage:  ./set_adult_pin.sh 4321
# The app fetches the new PIN from GitHub on the next unlock.
set -e
PIN="${1:?usage: set_adult_pin.sh <4-digit-pin>}"
echo "$PIN" | grep -qE '^[0-9]{4}$' || { echo "PIN must be exactly 4 digits"; exit 1; }
cd "$(dirname "$0")"
printf '{ "pin": "%s" }\n' "$PIN" > src/config/adultPin.json
git add src/config/adultPin.json
git commit -m "chore: change 18+ PIN"
git push origin main
echo "✅ PIN changed to $PIN — live in ~1 minute, no rebuild needed."
