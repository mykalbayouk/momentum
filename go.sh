#!/bin/bash

echo "Pulling latest changes from main branch..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Starting Expo with tunnel..."
npx expo start --tunnel 