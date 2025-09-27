# Setup

## What you need

- Node.js (I'm using 18+)
- Expo CLI: `npm install -g @expo/cli`

## Getting started

Clone and install:
```bash
git clone <this-repo>
cd my-gallery-application
npm install
```

## Running it

For web (easiest way):
```bash
npm start
```
Then press 'w' or go to http://localhost:8081

For mobile:
```bash
npm start
```
Scan the QR code with Expo Go app.

## If something breaks

- Clear cache: `npx expo start --clear`
- Delete node_modules and reinstall
- Make sure you're using a recent browser for web

## OAuth setup (optional)

The app works with mock auth by default. If you want real Google login, you'll need to:
1. Create a Google Cloud project
2. Set up OAuth credentials  
3. Add them to a `.env` file

But honestly, the mock version works fine for testing.