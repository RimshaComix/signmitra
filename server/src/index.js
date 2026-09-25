const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const emergencyRoutes = require('./routes/emergencyRoutes');

// Import your custom domain routers matching the blueprint layout
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use('/api/emergency', emergencyRoutes);

// 🔒 Privacy Data Minimization & Security Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', // Permits clean Next.js dashboard interactions
  optionsSuccessStatus: 200
}));
app.use(express.json()); // Parses incoming json request structures safely

// Structured Observability Logging Middleware matching Section 22
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[SignMitra API Log] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount the API endpoint branches
app.use('/api/sessions', sessionRoutes);

// Base System Status Route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date(),
    engine: 'SignMitra Stateful Deterministic Core v1.0.0' 
  });
});

// Fallback Route for non-matching endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint routing parameters unrecognized.' });
});

// Connect to MongoDB Database Engine safely
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signmitra';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ [SignMitra Database] Connection to MongoDB engine established successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 [SignMitra Server] Monolith Core online and broadcasting from port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ [SignMitra Database] Initial critical engine connection failed:', err.message);
    process.exit(1);
  });
