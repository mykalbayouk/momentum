#!/bin/bash

# # Install expo-dev-client
# echo "Installing expo-dev-client..."
# npx expo install expo-dev-client

# # Install eas-cli globally and login
# echo "Installing eas-cli globally..."
# npm install -g eas-cli

# echo "Logging into EAS..."
# eas login 

# Start the build process with non-interactive mode
echo "Starting iOS build process..."
eas build --platform ios --profile development 


# Note: You'll need to set these environment variables before running the script:
# export APPLE_PASSWORD="your-apple-password"
# export APPLE_TEAM_ID="your-team-id" 