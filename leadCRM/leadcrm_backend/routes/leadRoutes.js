const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const {
    getLeads,
    createLead,
    updateLeadStatus,
    deleteLead
} = require('../controllers/leadController');

// All lead routes require a valid login token.
router.use(protect);

router.get('/', getLeads);
router.post('/', createLead);
router.put('/:id', updateLeadStatus);
router.delete('/:id', deleteLead);

module.exports = router;
