# Fee Structure Guide

## Client Types and Fee Rates

The system automatically calculates bills based on client type. Here are the default rates:

### Regular Clients
- **Hourly Rate**: ₹5,000/hour
- **Fixed Fee**: ₹50,000
- **Contingency**: 15% of case value
- **Retainer**: ₹1,00,000

### Known Clients
- **Hourly Rate**: ₹3,000/hour
- **Fixed Fee**: ₹30,000
- **Contingency**: 10% of case value
- **Retainer**: ₹60,000

### Government Clients
- **Hourly Rate**: ₹8,000/hour
- **Fixed Fee**: ₹1,00,000
- **Contingency**: 20% of case value
- **Retainer**: ₹2,00,000

### Corporate Clients
- **Hourly Rate**: ₹10,000/hour
- **Fixed Fee**: ₹1,50,000
- **Contingency**: 25% of case value
- **Retainer**: ₹3,00,000

## Fee Structures Explained

### 1. Hourly
- Bill is calculated based on hours worked × hourly rate
- Admin must specify the number of hours when generating the bill
- Example: 10 hours × ₹5,000 = ₹50,000 (before tax)

### 2. Fixed Fee
- A fixed amount is charged regardless of time spent
- Amount varies by client type
- Example: Regular client = ₹50,000 fixed fee

### 3. Contingency
- Percentage-based fee calculated from case value
- Admin must provide the case value when generating bill
- Example: ₹10,00,000 case value × 15% = ₹1,50,000 (before tax)

### 4. Retainer
- Fixed monthly/yearly retainer amount
- Amount varies by client type
- Example: Regular client = ₹1,00,000 retainer

## Tax Calculation

All bills include 18% GST (Goods and Services Tax) added to the base amount.

**Calculation Formula:**
- Base Amount = (Fee based on structure) + Additional Charges - Discount
- Tax = Base Amount × 0.18
- Total Amount = Base Amount + Tax

## Customizing Fee Rates

Fee rates are defined in `server/routes/bills.js` in the `FEE_STRUCTURES` object. You can modify these rates according to your needs.

