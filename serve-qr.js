// Simple server to serve QR code page
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// Serve the QR code page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'qr-code.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`QR code server running at http://localhost:${PORT}`);
  console.log(`Access this page to see and scan the QR code.`);
});