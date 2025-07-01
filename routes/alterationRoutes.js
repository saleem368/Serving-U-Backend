const express = require('express');
const router = express.Router();
const alterationController = require('../controllers/alterationController');
 
// POST /api/alterations - Create new alteration appointment
router.post('/', alterationController.createAlteration);

// GET /api/alterations - Get all alteration appointments
router.get('/', alterationController.getAlterations);

// PATCH /api/alterations/:id/status - Update status
router.patch('/:id/status', alterationController.updateStatus);

// PATCH /api/alterations/:id/admin-total - Update admin total
router.patch('/:id/admin-total', alterationController.updateAdminTotal);

// PATCH /api/alterations/:id/payment-status - Update payment status
router.patch('/:id/payment-status', alterationController.updatePaymentStatus);

module.exports = router;
