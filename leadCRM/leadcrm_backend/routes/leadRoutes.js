const express = require('express');
const router = express.Router();
const { 
    getLeads, 
    createLead, 
    updateLeadStatus, 
    deleteLead 
} = require('../controllers/leadController');


router.get('/', getLeads);


router.post('/', createLead);


router.put('/:id', updateLeadStatus);


router.delete('/:id', deleteLead);

module.exports = router;