// ============================================
// ROUTES INDEX
// ============================================
// File: routes/index.js
// Description: Aggregates all route modules
// Order: Alphabetical
// ============================================

module.exports = [
    require('./authRoutes').router,      // Authentication routes
    require('./categoryRoutes'),          // Category routes
    require('./dashboardRoutes'),         // Dashboard routes
    require('./menuRoutes'),              // Menu routes
    require('./orderRoutes'),             // Order routes
    require('./billingRoutes'),           // Billing routes
    require('./tableRoutes')   // Restaurant table routes
];
  