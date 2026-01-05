const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads (basic setup - should use cloud storage in production)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, PNG allowed.'));
    }
  }
});

// @route   POST /api/documents
// @desc    Upload a document
// @access  Private
router.post('/', [
  auth,
  upload.single('file'),
  body('name').trim().notEmpty().withMessage('Document name is required'),
  body('documentType').isIn(['FIR', 'Charge Sheet', 'Court Order', 'Petition', 'Evidence', 'Contract', 'Bail Application', 'Other']).withMessage('Invalid document type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = new Document({
      name: req.body.name,
      originalName: req.file.originalname,
      caseId: req.body.caseId || null,
      clientId: req.body.clientId || null,
      documentType: req.body.documentType || 'Other',
      fileUrl: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      tags: req.body.tags ? req.body.tags.split(',') : [],
      description: req.body.description,
      isConfidential: req.body.isConfidential === 'true'
    });

    await document.save();

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/documents
// @desc    Get all documents
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { caseId, clientId, documentType } = req.query;
    const query = {};

    // Employees see only documents for their cases
    if (req.user.role !== 'admin') {
      // This would need case assignment check - simplified for now
    }

    if (caseId) query.caseId = caseId;
    if (clientId) query.clientId = clientId;
    if (documentType) query.documentType = documentType;

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('caseId', 'caseNumber title')
      .populate('clientId', 'name')
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents/:id
// @desc    Get single document
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('caseId', 'caseNumber title')
      .populate('clientId', 'name');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only admin or document uploader can delete
    if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await document.deleteOne();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

