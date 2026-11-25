# FoodExpress - React + Express + JSON

## Requirements
- Node.js LTS
- VS Code

## Setup
1. Open this folder in VS Code.
2. Open a terminal in this folder.
3. Run `npm.cmd install`.
4. In terminal 1, run `npm.cmd run server`.
5. In terminal 2, run `npm.cmd run dev`.
6. Open the local URL printed by Vite (usually http://localhost:5173).

## Admin demo login
- Username: admin
- Password: admin123

## Files
- `src/App.jsx`: React UI and user/admin features
- `src/App.css`: application styling
- `src/index.css`: global styling
- `src/main.jsx`: React entry point
- `server/server.js`: Express API and JSON file operations
- `server/data.json`: locally stored users, foods and orders
- `vite.config.js`: forwards `/api` requests to Express
- `package.json`: dependencies and commands
- `index.html`: Vite HTML entry
- `.gitignore`: excludes generated files

## Important
This is a local learning project. User passwords are stored as plain text and admin API routes are not protected by a production authentication system. Do not deploy this demo publicly or use real passwords/payment details. For a real application, use password hashing, authenticated sessions/tokens, server-side authorization, validation and a database.

The `node_modules` folder and `package-lock.json` are created on your computer when you run `npm.cmd install`; they are intentionally not included in this ZIP.
