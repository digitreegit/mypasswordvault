#!/usr/bin/env bash
# Build a signed Android App Bundle (AAB) for Play Console.
# Requires android/keystore.properties (see keystore.properties.example).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f android/keystore.properties ]]; then
  echo "Missing android/keystore.properties"
  echo "Copy android/keystore.properties.example → android/keystore.properties and fill passwords."
  exit 1
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

export JAVA_HOME="${JAVA_HOME:-/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home}"
export PATH="$JAVA_HOME/bin:$PATH"

npm run build:capacitor
npx cap sync android
node scripts/patch-android-oauth.mjs
node scripts/patch-android-shell.mjs

cd android
./gradlew bundleRelease

AAB="app/build/outputs/bundle/release/app-release.aab"
ls -lh "$AAB"
jarsigner -verify -certs "$AAB" | head -5
echo "Signed AAB ready: $ROOT/android/$AAB"
