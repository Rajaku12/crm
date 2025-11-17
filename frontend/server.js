/**
 * Simple Express server for serving React SPA on Render
 * This handles client-side routing by serving index.html for all routes
 * 
 * Note: This file uses CommonJS (require) instead of ES modules
 * because Express works better with CommonJS
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle React routing - return all requests to index.html
// This ensures client-side routing works when users refresh or navigate directly to routes
app.get('*', (req, res) => {
  try {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal Server Error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend server is running on port ${port}`);
  console.log(`Serving static files from: ${join(__dirname, 'dist')}`);
});

