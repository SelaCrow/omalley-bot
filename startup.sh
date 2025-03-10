#!/bin/bash

# Remove the existing node_modules directory
rm -rf node_modules

# Reinstall dependencies
npm install

# Rebuild better-sqlite3 from source
npm rebuild better-sqlite3 --build-from-source

# Start the bot
node index.js