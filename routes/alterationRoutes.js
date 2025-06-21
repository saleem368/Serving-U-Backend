const express = require('express');
const router = express.Router();
const alterationController = require('../controllers/alterationController');

// POST /api/alterations - Create new alteration appointment
router.post('/', alterationController.createAlteration);

// GET /api/alterations - Get all alteration appointments
router.get('/', alterationController.getAlterations);

// PATCH /api/alterations/:id/status - Update status
router.patch('/:id/status', alterationController.updateStatus);

module.exports = router;
