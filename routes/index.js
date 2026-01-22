// ============================================
// ROUTES INDEX
// ============================================
// File: routes/index.js
// Description: Aggregates all route modules
// Order: Alphabetical
// ============================================

module.exports = [
    require('./authRoutes').router,      // Authentication routes
    require('./billingRoutes'),           // Billing routes
    // Note: branchRoutes is registered separately in app.js at /branch to avoid conflicts
    require('./categoryRoutes'),          // Category routes
    require('./dashboardRoutes'),         // Dashboard routes
    require('./employeeRoutes'),          // Employee routes
    require('./menuRoutes'),              // Menu routes
    require('./orderRoutes'),             // Order routes
    require('./tableRoutes')              // Restaurant table routes
];
  