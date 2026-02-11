// ============================================
// ROUTES INDEX
// ============================================
// File: routes/index.js
// Description: Aggregates all route modules
// Order: Alphabetical
// ============================================

module.exports = [
    require('./authRoutes').router,      // Authentication routes
    require('./auditLogRoutes'),         // Audit log routes
    require('./billingRoutes'),           // Billing routes
    // Note: branchRoutes is registered separately in app.js at /branch to avoid conflicts
    require('./categoryRoutes'),          // Category routes
    require('./dashboardRoutes'),         // Dashboard routes
    require('./employeeRoutes'),          // Employee routes
    require('./menuRoutes'),              // Menu routes
    require('./notificationRoutes'),     // Notification routes
    require('./orderRoutes'),             // Order routes
    require('./reportsRoutes'),           // Reports routes
    require('./tableRoutes'),             // Restaurant table routes
    require('./uploadRoutes'),            // Upload routes
    require('./userProfileRoutes')        // User profile routes
];
  