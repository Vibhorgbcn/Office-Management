const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const { auth, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/contracts
// @desc    Create a new contract
// @access  Private
router.post('/', [
  auth,
  body('contractNumber').trim().notEmpty().withMessage('Contract number is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('contractType').isIn(['service-agreement', 'retainer', 'consultation', 'partnership', 'employment', 'nda', 'other']).withMessage('Invalid contract type'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contractData = {
      ...req.body,
      createdBy: req.user._id,
      status: 'draft'
    };

    const newContract = new Contract(contractData);
    await newContract.save();

    const populatedContract = await Contract.findById(newContract._id)
      .populate('clientId', 'name email phone')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedContract);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Contract number already exists' });
    }
    console.error('Error creating contract:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/contracts
// @desc    Get all contracts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user._id },
        { 'approvalWorkflow.approver': req.user._id },
        { 'signatories.email': req.user.email }
      ];
    }

    const { status, contractType, clientId } = req.query;
    if (status) query.status = status;
    if (contractType) query.contractType = contractType;
    if (clientId) query.clientId = clientId;

    const contracts = await Contract.find(query)
      .populate('clientId', 'name email phone')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email')
      .populate('approvalWorkflow.approver', 'name email')
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/contracts/:id
// @desc    Get a single contract
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('clientId', 'name email phone address')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email')
      .populate('approvalWorkflow.approver', 'name email')
      .populate('notes.addedBy', 'name email');

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/contracts/:id
// @desc    Update contract
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    Object.assign(contract, req.body);
    contract.lastModifiedBy = req.user._id;
    await contract.save();

    const populatedContract = await Contract.findById(contract._id)
      .populate('clientId', 'name email phone')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email');

    res.json(populatedContract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/contracts/:id/approve
// @desc    Approve/reject contract in workflow
// @access  Private
router.put('/:id/approve', [
  auth,
  body('status').isIn(['approved', 'rejected']).withMessage('Invalid status'),
  body('comments').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const workflowItem = contract.approvalWorkflow.find(
      w => w.approver.toString() === req.user._id.toString() && w.status === 'pending'
    );

    if (!workflowItem) {
      return res.status(403).json({ message: 'No pending approval found for this user' });
    }

    workflowItem.status = req.body.status;
    workflowItem.comments = req.body.comments || '';
    workflowItem.approvedAt = new Date();

    // Check if all approvals are done
    const allApproved = contract.approvalWorkflow.every(w => w.status !== 'pending');
    if (allApproved) {
      contract.status = 'approved';
    } else if (req.body.status === 'rejected') {
      contract.status = 'rejected';
    }

    await contract.save();
    res.json(contract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/contracts/:id
// @desc    Delete contract
// @access  Private/Admin
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    await contract.deleteOne();
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

