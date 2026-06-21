// =============================================
// POS Enhancement Backend - Server Setup
// This file shows how to integrate the new API routes
// =============================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import route modules
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const favoritesRoutes = require('./routes/favorites');
const analyticsRoutes = require('./routes/analytics');
const receiptSettingsRoutes = require('./routes/receipt-settings');
const displaySettingsRoutes = require('./routes/display-settings');
const qrisUploadRoutes = require('./routes/qris-upload');

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/outlets', receiptSettingsRoutes); // Handles /api/outlets/:id/receipt-settings
app.use('/api/outlets', displaySettingsRoutes); // Handles /api/outlets/:id/display-settings
app.use('/api/outlets', qrisUploadRoutes); // Handles /api/outlets/:id/qris/*

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 POS Enhancement Backend running on port ${PORT}`);
  console.log(`📊 API endpoints available:`);
  console.log(`   - POST   /api/favorites`);
  console.log(`   - GET    /api/favorites?userId=X`);
  console.log(`   - DELETE /api/favorites/:productId`);
  console.log(`   - PUT    /api/favorites/reorder`);
  console.log(`   - GET    /api/analytics/top-products`);
  console.log(`   - GET    /api/outlets/:id/receipt-settings`);
  console.log(`   - PUT    /api/outlets/:id/receipt-settings`);
  console.log(`   - GET    /api/outlets/:id/display-settings`);
  console.log(`   - PUT    /api/outlets/:id/display-settings`);
  console.log(`   - GET    /api/outlets/:id/qris`);
  console.log(`   - POST   /api/outlets/:id/qris/upload`);
  console.log(`   - DELETE /api/outlets/:id/qris`);
});

module.exports = app;
