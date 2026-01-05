# Legal Office Management System - Enhanced Features

This document outlines the comprehensive enhancements made to align with the LOMS (Legal Office Management System) blueprint.

## 🎯 Implementation Summary

### ✅ Completed Enhancements

#### 1. **Enhanced Case Management**
- ✅ Added `filingDate` and `nextHearingDate` fields
- ✅ Enhanced court types (Supreme Court, High Court, District Court, National Criminal Court, Special Court)
- ✅ Added `clientId` reference for better client-case relationship
- ✅ Added `pro-bono` client type support

#### 2. **Hierarchical User Roles**
- ✅ Enhanced User model with hierarchical roles:
  - `admin` - Criminal Lawyer (Owner)
  - `senior-advocate` - Senior Advocate
  - `junior-advocate` - Junior Advocate
  - `clerk` - Clerk
  - `intern` - Intern
  - `employee` - General employee
- ✅ Added `reportsTo` field for organizational hierarchy

#### 3. **Advanced Biometric Attendance**
- ✅ Added `biometricVerified` flag
- ✅ Added location tracking (latitude, longitude, address)
- ✅ Added device information (deviceId, deviceType, ipAddress)
- ✅ Support for multiple device types: 'fingerprint', 'face', 'manual'

#### 4. **Advanced Billing Rule Engine** ⭐
The most critical enhancement - **Intelligent fee calculation** based on:
- **Client Type** (Regular, Known, Government, Corporate, Pro-bono)
- **Court** (Supreme Court: 2.5x, High Court: 1.8x, District: 1.0x, etc.)
- **Case Type** (Criminal: 1.0x, Environment Law: 1.3x, Constitutional: 2.0x, etc.)
- **Work Type** (Drafting: 1.0x, Appearance: 1.5x, Consultation: 0.8x, etc.)

**Formula**: `Base Rate × Court Multiplier × Case Type Multiplier × Work Type Multiplier`

**New Features**:
- Automatic fee suggestions for different work types
- Admin can override calculated amounts
- Detailed calculation breakdown in bill records
- Support for hourly, fixed, contingency, and retainer structures

#### 5. **Enhanced Work Assignment/Task System**
- ✅ Renamed to "Task" concept with better tracking
- ✅ Added `taskName` field
- ✅ Enhanced status: 'assigned', 'in-progress', 'submitted', 'approved', 'rejected', 'completed', 'overdue'
- ✅ Automatic overdue detection and calculation
- ✅ `overdueDays` tracking
- ✅ `isOverdue` flag

#### 6. **Client Management System**
- ✅ New `Client` model with comprehensive fields:
  - Contact information (email, phone, alternate phone)
  - Address details
  - PAN and GSTIN
  - Client type classification
  - Notes and metadata
- ✅ Full CRUD operations for clients
- ✅ Search functionality

#### 7. **Document Management System**
- ✅ New `Document` model with:
  - File upload support (PDF, DOC, DOCX, TXT, Images)
  - Document types: FIR, Charge Sheet, Court Order, Petition, Evidence, Contract, Bail Application
  - Version control support
  - Confidential flag
  - Tags and descriptions
  - Case and Client associations
- ✅ File upload with multer
- ✅ Access control based on user role

#### 8. **Audit Logging System**
- ✅ New `AuditLog` model for security and compliance
- ✅ Tracks: create, update, delete, view, login, logout, export, print
- ✅ Records entity changes, user actions, IP addresses
- ✅ Indexed for efficient querying

### 📊 Enhanced Models

#### Case Model Enhancements
```javascript
- filingDate: Date (required)
- nextHearingDate: Date
- clientId: ObjectId (reference to Client)
- clientType: Added 'pro-bono'
- court: Enhanced court list
```

#### User Model Enhancements
```javascript
- role: ['admin', 'senior-advocate', 'junior-advocate', 'clerk', 'intern', 'employee']
- reportsTo: ObjectId (hierarchical structure)
```

#### Attendance Model Enhancements
```javascript
- biometricVerified: Boolean
- location: { latitude, longitude, address }
- deviceInfo: { deviceId, deviceType, ipAddress }
```

#### Bill Model Enhancements
```javascript
- workType: ['Drafting', 'Appearance', 'Consultation', 'Research', 'Filing']
- court: String
- caseType: String
- calculationDetails: { multipliers: { court, caseType, workType, combined } }
```

#### WorkAssignment Model Enhancements
```javascript
- taskName: String
- status: Added 'submitted', 'approved', 'rejected'
- isOverdue: Boolean (auto-calculated)
- overdueDays: Number (auto-calculated)
```

### 🔧 New Utilities

#### Billing Engine (`server/utils/billingEngine.js`)
- `calculateBillAmount()` - Main calculation function
- `getSuggestedFees()` - Get fee suggestions for all work types
- Configurable multipliers for all factors

### 🛣️ New API Routes

#### Clients
- `POST /api/clients` - Create client (Admin only)
- `GET /api/clients` - Get all clients (Admin only)
- `GET /api/clients/:id` - Get single client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

#### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get single document
- `DELETE /api/documents/:id` - Delete document

#### Enhanced Bills
- `POST /api/bills/suggest-fees` - Get suggested fees for a case

## 📋 Usage Examples

### Billing Example

**Scenario**: Generate bill for Supreme Court Environment Law case, known client, Appearance work

```javascript
// Request
POST /api/bills/generate
{
  "caseId": "...",
  "feeStructure": "hourly",
  "hours": 8,
  "workType": "Appearance"
}

// Calculation
- Base hourly rate (known client): ₹3,000
- Court multiplier (Supreme Court): 2.5x
- Case type multiplier (Environment Law): 1.3x
- Work type multiplier (Appearance): 1.5x
- Combined: 2.5 × 1.3 × 1.5 = 4.875x
- Hourly rate: ₹3,000 × 4.875 = ₹14,625/hour
- Total for 8 hours: ₹1,17,000
- + 18% GST: ₹1,38,060
```

### Suggested Fees Example

```javascript
POST /api/bills/suggest-fees
{
  "caseId": "..."
}

// Returns suggested fees for all work types:
{
  "Drafting": { hourly: ₹..., fixed: ₹... },
  "Appearance": { hourly: ₹..., fixed: ₹... },
  "Consultation": { hourly: ₹..., fixed: ₹... },
  ...
}
```

## 🔐 Security Enhancements

1. ✅ Role-based access control (RBAC)
2. ✅ Audit logging for all critical actions
3. ✅ IP address tracking
4. ✅ Document access control
5. ✅ Biometric verification tracking

## 📈 Next Steps (Future Enhancements)

### Phase 2 Features (Recommended)
- [ ] PDF bill generation
- [ ] Email/WhatsApp notifications for overdue tasks
- [ ] Dashboard with countdown timers
- [ ] Hearing date reminders
- [ ] Productivity reports
- [ ] Case history summaries

### Phase 3 Features (Optional)
- [ ] Biometric hardware integration (Mantra/Morpho SDK)
- [ ] AWS S3/Azure Blob for document storage
- [ ] AI document suggestions
- [ ] Mobile app
- [ ] Two-factor authentication
- [ ] Database migration to PostgreSQL (if needed)

## 📝 Database Migration Notes

All enhancements are backward compatible with existing MongoDB data. However, you should:

1. Run migration scripts to update existing documents with new fields
2. Set default values for new fields where appropriate
3. Index new fields for better query performance

## 🚀 Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Install new dependencies: `npm install` (adds multer)
- [ ] Create `uploads/` directory for documents
- [ ] Set up cloud storage (recommended) for production
- [ ] Configure biometric device integration
- [ ] Set up audit log archival
- [ ] Configure backup strategy

## 📚 Files Modified/Created

### Modified Files
- `server/models/Case.js` - Enhanced with new fields
- `server/models/User.js` - Added hierarchical roles
- `server/models/Attendance.js` - Added biometric tracking
- `server/models/Bill.js` - Added work type and calculation details
- `server/models/WorkAssignment.js` - Enhanced task tracking
- `server/routes/bills.js` - Integrated billing engine
- `server/routes/attendance.js` - Added biometric support
- `server/index.js` - Added new routes
- `server/package.json` - Added multer dependency

### New Files
- `server/models/Client.js` - Client management
- `server/models/Document.js` - Document management
- `server/models/AuditLog.js` - Audit logging
- `server/utils/billingEngine.js` - Advanced billing logic
- `server/routes/clients.js` - Client routes
- `server/routes/documents.js` - Document routes
- `ENHANCEMENTS.md` - This file

## 💡 Key Improvements Summary

1. **Intelligent Billing**: Automatic fee calculation based on multiple factors
2. **Better Organization**: Hierarchical user roles and client management
3. **Enhanced Security**: Biometric tracking, audit logs, access control
4. **Professional Features**: Document management, version control
5. **Better Tracking**: Overdue detection, delivery days, status workflow

All enhancements align with the LOMS blueprint while maintaining backward compatibility with the existing system.

