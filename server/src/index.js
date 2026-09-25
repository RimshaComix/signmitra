const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import domain routers
const emergencyRoutes = require('./routes/emergencyRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Core Security & Parsing Middleware (MUST be declared before routes)
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  optionsSuccessStatus: 200
}));
app.use(express.json());

// 2. Structured Observability Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[SignMitra API Log] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 3. Mount API Route Branches
app.use('/api/emergency', emergencyRoutes);
app.use('/api/sessions', sessionRoutes);

// 4. Base System Status / Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date(),
    engine: 'SignMitra Stateful Deterministic Core v1.0.0' 
  });
});

// 5. 404 Fallback Route
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint routing parameters unrecognized.' });
});

// 6. Connect to MongoDB Database Engine & Start Server
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