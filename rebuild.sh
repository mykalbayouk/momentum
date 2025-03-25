#!/bin/bash

echo "🚀 Starting rebuild process..."

# Clean up
echo "🧹 Cleaning up build folders and dependencies..."
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build

# Reinstall dependencies
echo "📦 Reinstalling node modules..."
npm install

# iOS specific steps
echo "🍎 Setting up iOS..."
cd ios
pod install
cd ..

# Android specific steps
echo "🤖 Setting up Android..."
cd android
./gradlew clean
cd ..

echo "✨ Rebuild process completed!"
echo "To run the app:"
echo "iOS: npm run ios"
echo "Android: npm run android" 