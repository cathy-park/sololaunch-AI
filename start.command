#!/bin/bash

cd "$(dirname "$0")"

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if [ ! -d "node_modules" ]; then
  npm install
fi

npm run dev &
DEV_PID=$!

sleep 5
open "http://localhost:3000"

wait $DEV_PID