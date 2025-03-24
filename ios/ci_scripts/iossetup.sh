#!/bin/sh

# Install Node.js using Homebrew
brew install node

# Install CocoaPods using Homebrew
brew install cocoapods

# Navigate to the project root directory
cd ..

# Install Node.js dependencies
npm install

# Navigate back to the ios directory
cd ios

# Install dependencies you manage with CocoaPods
pod install