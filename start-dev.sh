#!/bin/bash

# Kill any running Next.js processes
echo "Killing any running Next.js processes..."
pkill -f "node.*next" || true

# Clear the Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Clear port if still in use
port=3002
echo "Checking if port $port is in use..."
pid=$(lsof -ti :$port)
if [ ! -z "$pid" ]; then
    echo "Port $port is in use by process $pid, killing..."
    kill -9 $pid
fi

# Start the development server
echo "Starting Next.js development server on port $port..."
npm run dev -- -p $port 