#!/bin/bash

echo "Starting startup.sh script..."

# Record the start time
start_time=$(date +%s)

# Remove the existing node_modules directory
echo "Removing node_modules directory..."
rm -rf node_modules
echo "node_modules directory removed."

# Record the time after removing node_modules
time_after_rm=$(date +%s)
echo "Time taken to remove node_modules: $((time_after_rm - start_time)) seconds."

# Clean up any leftover files in node_modules
echo "Cleaning up node_modules directory..."
find node_modules -type d -name '.*' -exec rm -rf {} +
echo "node_modules directory cleaned up."

# Reinstall dependencies with retry logic
echo "Reinstalling dependencies..."
retry_count=0
max_retries=3
while [ $retry_count -lt $max_retries ]; do
    npm install && break
    retry_count=$((retry_count + 1))
    echo "npm install failed, retrying ($retry_count/$max_retries)..."
    sleep 5
done
if [ $retry_count -eq $max_retries ]; then
    echo "npm install failed after $max_retries attempts, exiting..."
    exit 1
fi
echo "Dependencies reinstalled."

# Record the time after reinstalling dependencies
time_after_install=$(date +%s)
echo "Time taken to reinstall dependencies: $((time_after_install - time_after_rm)) seconds."

# Rebuild sequelize from source
echo "Rebuilding sequelize from source..."
npm rebuild sequelize --build-from-source
if [ $? -ne 0 ]; then
    echo "Failed to rebuild sequelize, exiting..."
    exit 1
fi
echo "sequelize rebuilt from source."

# Record the time after rebuilding sequelize
time_after_rebuild=$(date +%s)
echo "Time taken to rebuild sequelize: $((time_after_rebuild - time_after_install)) seconds."

# List files in the current directory for debugging
echo "Listing files in the current directory..."
ls -la

# Check if index.js exists
if [ -f "index.js" ]; then
    echo "index.js found, starting the bot..."
    node index.js
else
    echo "index.js not found, exiting..."
    exit 1
fi

# Record the end time
end_time=$(date +%s)
echo "Total startup time: $((end_time - start_time)) seconds."