#!/bin/bash
echo "Updating Code"
git pull
echo "Updating NPM"
npm install
cd app/
npm install
cd ..
echo "Building From Source"
gulp
echo "Restarting App"
systemctl restart surveyApp.service
