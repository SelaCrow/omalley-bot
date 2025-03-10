#!/bin/bash

echo "Starting startup.sh script..."

# Remove the existing node_modules directory
echo "Removing node_modules directory..."
rm -rf node_modules

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

# Rebuild better-sqlite3 from source
echo "Rebuilding better-sqlite3 from source..."
npm rebuild better-sqlite3 --build-from-source

# Start the bot
echo "Starting the bot..."
node index.js