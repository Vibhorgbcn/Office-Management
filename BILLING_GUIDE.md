# Advanced Billing System Guide

## Overview

The billing system now uses an intelligent rule engine that automatically calculates fees based on multiple factors, making it perfect for a legal practice handling diverse cases across different courts.

## How It Works

### Calculation Formula

```
Final Fee = Base Rate × Court Multiplier × Case Type Multiplier × Work Type Multiplier
```

### Factors

#### 1. Client Type (Base Rates)
| Client Type | Hourly | Fixed | Contingency | Retainer |
|------------|--------|-------|-------------|----------|
| Regular | ₹5,000 | ₹50,000 | 15% | ₹1,00,000 |
| Known | ₹3,000 | ₹30,000 | 10% | ₹60,000 |
| Government | ₹8,000 | ₹1,00,000 | 20% | ₹2,00,000 |
| Corporate | ₹10,000 | ₹1,50,000 | 25% | ₹3,00,000 |
| Pro-bono | ₹0 | ₹0 | 0% | ₹0 |

#### 2. Court Multipliers
| Court | Multiplier |
|-------|------------|
| Supreme Court | 2.5x |
| High Court | 1.8x |
| District Court | 1.0x |
| National Criminal Court | 1.2x |
| Special Court | 1.5x |

#### 3. Case Type Multipliers
| Case Type | Multiplier |
|-----------|------------|
| Criminal | 1.0x |
| Environment Law | 1.3x |
| Civil | 0.9x |
| Constitutional | 2.0x |
| Other | 1.0x |

#### 4. Work Type Multipliers
| Work Type | Multiplier |
|-----------|------------|
| Drafting | 1.0x |
| Appearance | 1.5x |
| Consultation | 0.8x |
| Research | 0.7x |
| Filing | 0.5x |

## Examples

### Example 1: Supreme Court Appearance (Known Client, Criminal Case)

**Parameters:**
- Client: Known
- Court: Supreme Court
- Case Type: Criminal
- Work Type: Appearance
- Fee Structure: Hourly (8 hours)

**Calculation:**
```
Base Rate: ₹3,000/hour
Court: 2.5x
Case Type: 1.0x
Work Type: 1.5x
Combined: 2.5 × 1.0 × 1.5 = 3.75x

Rate per hour: ₹3,000 × 3.75 = ₹11,250/hour
Total for 8 hours: ₹90,000
+ 18% GST: ₹16,200
**Final Amount: ₹1,06,200**
```

### Example 2: Environment Law Case (Regular Client, High Court, Drafting)

**Parameters:**
- Client: Regular
- Court: High Court
- Case Type: Environment Law
- Work Type: Drafting
- Fee Structure: Fixed

**Calculation:**
```
Base Rate: ₹50,000
Court: 1.8x
Case Type: 1.3x
Work Type: 1.0x
Combined: 1.8 × 1.3 × 1.0 = 2.34x

Fixed Fee: ₹50,000 × 2.34 = ₹1,17,000
+ 18% GST: ₹21,060
**Final Amount: ₹1,38,060**
```

### Example 3: Constitutional Case (Corporate Client, Supreme Court, Consultation)

**Parameters:**
- Client: Corporate
- Court: Supreme Court
- Case Type: Constitutional
- Work Type: Consultation
- Fee Structure: Hourly (3 hours)

**Calculation:**
```
Base Rate: ₹10,000/hour
Court: 2.5x
Case Type: 2.0x
Work Type: 0.8x
Combined: 2.5 × 2.0 × 0.8 = 4.0x

Rate per hour: ₹10,000 × 4.0 = ₹40,000/hour
Total for 3 hours: ₹1,20,000
+ 18% GST: ₹21,600
**Final Amount: ₹1,41,600**
```

## API Usage

### Generate Bill with Automatic Calculation

```javascript
POST /api/bills/generate
{
  "caseId": "case_id_here",
  "feeStructure": "hourly",
  "hours": 8,
  "workType": "Appearance"
}
```

### Get Suggested Fees

```javascript
POST /api/bills/suggest-fees
{
  "caseId": "case_id_here"
}

// Response includes suggested fees for all work types:
{
  "suggestions": {
    "Drafting": {
      "hourly": { baseAmount: ..., hourlyRate: ... },
      "fixed": { baseAmount: ... }
    },
    "Appearance": { ... },
    ...
  }
}
```

### Override Calculation (Admin Only)

```javascript
POST /api/bills/generate
{
  "caseId": "case_id_here",
  "feeStructure": "hourly",
  "hours": 8,
  "workType": "Appearance",
  "overrideAmount": 50000  // Admin override
}
```

## Benefits

1. **Automatic**: No manual fee calculation needed
2. **Consistent**: Same rules apply to all cases
3. **Transparent**: Detailed calculation breakdown saved with each bill
4. **Flexible**: Admin can override when needed
5. **Fair**: Different rates for different complexity levels

## Customization

To modify rates or multipliers, edit `server/utils/billingEngine.js`:

```javascript
const COURT_MULTIPLIERS = {
  'Supreme Court': 2.5,  // Adjust as needed
  ...
};

const CLIENT_BASE_RATES = {
  regular: {
    hourly: 5000,  // Adjust as needed
    ...
  },
  ...
};
```

## Tax Calculation

All bills automatically include 18% GST (Goods and Services Tax):
- Base Amount + Additional Charges - Discount = Subtotal
- Subtotal × 0.18 = Tax
- Subtotal + Tax = Total Amount

