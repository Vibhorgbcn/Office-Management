const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const ClientInteraction = require('../models/ClientInteraction');
const { auth, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/clients
// @desc    Create a new client
// @access  Private/Admin
router.post('/', [
  auth,
  adminOnly,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('clientType').isIn(['regular', 'known', 'government', 'corporate', 'pro-bono']).withMessage('Invalid client type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = new Client({
      ...req.body,
      createdBy: req.user._id
    });

    await client.save();

    res.status(201).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/clients
// @desc    Get all clients (Admin can see all, Employees can see for dropdowns)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { clientType, search } = req.query;
    const query = {};

    if (clientType) query.clientType = clientType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Employees can only see basic client info (name, id) for dropdowns
    const clients = await Client.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // If employee, return limited fields
    if (req.user.role !== 'admin') {
      const limitedClients = clients.map(client => ({
        _id: client._id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        clientType: client.clientType
      }));
      return res.json(limitedClients);
    }

    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/clients/:id
// @desc    Get single client
// @access  Private/Admin
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Private/Admin
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    Object.assign(client, req.body);
    await client.save();

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete client
// @access  Private/Admin
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await client.deleteOne();
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/clients/:id/interactions
// @desc    Get client interactions
// @access  Private
router.get('/:id/interactions', auth, async (req, res) => {
  try {
    const interactions = await ClientInteraction.find({ clientId: req.params.id })
      .populate('userId', 'name email')
      .populate('contactPersonId', 'name email')
      .sort({ interactionDate: -1 });

    res.json(interactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clients/:id/interactions
// @desc    Create client interaction
// @access  Private
router.post('/:id/interactions', [
  auth,
  body('interactionType').isIn(['meeting', 'call', 'email', 'whatsapp', 'document-exchange', 'other']).withMessage('Invalid interaction type'),
  body('subject').trim().notEmpty().withMessage('Subject is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const interaction = new ClientInteraction({
      ...req.body,
      clientId: req.params.id,
      userId: req.user._id,
      interactionDate: req.body.interactionDate ? new Date(req.body.interactionDate) : new Date()
    });

    await interaction.save();

    const populated = await ClientInteraction.findById(interaction._id)
      .populate('userId', 'name email')
      .populate('contactPersonId', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

