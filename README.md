
# Hostel Hub - Local Setup Guide

This guide explains how to run this project locally using VS Code, Node.js, and MongoDB.

## Prerequisites
1. **Node.js** installed.
2. **MongoDB** installed locally or a MongoDB Atlas account.

## Step 1: Setup the Backend

1. Create a folder named `server` in the root directory.
2. Copy `server/index.js` and `server/models.js` into it.
3. Open a terminal in the `server` folder and run:
   ```bash
   npm init -y
   npm install express mongoose cors
   ```
4. Start the server:
   ```bash
   node index.js
   ```
   It should say: `Server running on http://localhost:5000` and `Connected to MongoDB`.

## Step 2: Setup the Frontend

1. In the root directory (where package.json is), run:
   ```bash
   npm install
   ```
2. **Switch to MongoDB Service**:
   Open `App.tsx`. Change the import line:
   
   **FROM:**
   ```typescript
   import { mockAuth, mockDB } from './services/mockData';
   ```
   
   **TO:**
   ```typescript
   // import { mockAuth, mockDB } from './services/mockData'; 
   import { api } from './services/mongoService';
   const mockAuth = api.auth;
   const mockDB = api.db;
   ```
   
   *Note: We alias `api.auth` to `mockAuth` so you don't have to rewrite the whole component tree.*

3. Start the frontend:
   ```bash
   npm run dev
   ```

## Step 3: Usage

1. Open http://localhost:5173 (or port shown).
2. Sign up (this will now save to your MongoDB).
3. Add hostels (saved to MongoDB).

## Troubleshooting

- **CORS Error?** Ensure the server is running on port 5000 and `app.use(cors())` is active.
- **DB Connection Error?** Ensure MongoDB is running locally on port 27017, or update the connection string in `server/index.js`.
