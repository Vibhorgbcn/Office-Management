# GPS Geofencing Attendance System - Implementation Guide

## Overview

The attendance system now uses GPS geofencing to ensure employees can only check in/out when they are physically at the office location. This provides accurate, auditable, and fraud-resistant attendance tracking.

## How It Works

1. **Admin Configures Office Locations**: Admin sets GPS coordinates and allowed radius for each office
2. **Employee Requests Check-In/Out**: Employee clicks button in app
3. **Browser Gets GPS**: App requests GPS location from browser/mobile
4. **Backend Validates**: Server checks if employee is within allowed radius
5. **Attendance Recorded**: If valid, attendance is saved with GPS coordinates

## Features

✅ **GPS-based validation** - Only allows attendance from office location
✅ **Multi-location support** - Support multiple offices (Chamber, Courts, etc.)
✅ **Accuracy validation** - Rejects low-accuracy GPS readings (>50m)
✅ **Anti-fraud measures** - Device fingerprinting, IP logging
✅ **Distance calculation** - Shows exact distance from office
✅ **Mobile & Web support** - Works on browsers and mobile devices

## Setup Instructions

### 1. Admin: Configure Office Locations

First, admin needs to set up office locations:

**API Endpoint**: `POST /api/office-locations`

**Example**:
```json
{
  "name": "Main Chamber - Connaught Place",
  "address": "123, Connaught Place, New Delhi",
  "latitude": 28.6304,
  "longitude": 77.2177,
  "radiusMeters": 100,
  "description": "Main office location"
}
```

**Common Delhi Locations**:
- **Supreme Court**: 28.6208, 77.2398 (radius: 200m)
- **Delhi High Court**: 28.5946, 77.2392 (radius: 200m)
- **Tis Hazari**: 28.6708, 77.2270 (radius: 150m)
- **Patiala House**: 28.6107, 77.2300 (radius: 150m)

### 2. How to Get GPS Coordinates

**Option 1: Google Maps**
1. Open Google Maps
2. Right-click on location
3. Click coordinates (latitude, longitude)

**Option 2: GPS Apps**
- Use any GPS app on phone
- Note down coordinates

**Option 3: Online Tools**
- Use latlong.net or similar tools

### 3. Radius Recommendations

- **Small Office/Chamber**: 50-100 meters
- **Large Office Building**: 100-150 meters
- **Court Complex**: 150-300 meters

## Usage

### For Employees

1. **Open Attendance Page**
2. **Click "Check In"** or **"Check Out"**
3. **Allow Location Access** when browser prompts
4. **Wait for GPS** to be fetched (may take 5-10 seconds)
5. **If inside office radius** → Attendance recorded ✅
6. **If outside office radius** → Error message shows distance ❌

### For Admin

#### View All Attendance with Locations

**API**: `GET /api/attendance/all`

Returns attendance records with:
- GPS coordinates (punch-in/out)
- Office location name
- Distance from office
- Device information

#### Manage Office Locations

**Create Location**:
```bash
POST /api/office-locations
{
  "name": "Supreme Court",
  "latitude": 28.6208,
  "longitude": 77.2398,
  "radiusMeters": 200
}
```

**List All Locations**:
```bash
GET /api/office-locations
```

**Update Location**:
```bash
PUT /api/office-locations/:id
{
  "radiusMeters": 250
}
```

**Deactivate Location**:
```bash
DELETE /api/office-locations/:id
```

## Validation Rules

### GPS Accuracy Check
- Maximum allowed accuracy: **50 meters**
- If accuracy > 50m, attendance is rejected
- Ensures reliable location data

### Distance Check
- Employee must be within **configured radius** of office
- Distance calculated using Haversine formula
- Supports multiple office locations

### Anti-Fraud Measures
1. **Once per day** - Can only check-in once per day
2. **Punch-out only after punch-in** - Must check-in before checkout
3. **GPS coordinates logged** - All coordinates saved for audit
4. **Device fingerprinting** - IP address, user agent logged
5. **Accuracy validation** - Low accuracy readings rejected

## Troubleshooting

### "GPS accuracy too low"
**Solution**: 
- Enable high-accuracy location on device
- Move to open area (better GPS signal)
- Wait for GPS to stabilize (5-10 seconds)

### "You are X meters away from office"
**Solution**:
- Move closer to office location
- Check if correct office is selected
- Contact admin to increase radius if needed

### "Geolocation is not supported"
**Solution**:
- Use modern browser (Chrome, Edge, Firefox)
- Ensure HTTPS is enabled (required for GPS)
- Check browser permissions

### "Location request timeout"
**Solution**:
- Check internet connection
- Enable location services on device
- Try again in open area

## Security Features

1. **GPS Validation** - Only allows attendance from configured locations
2. **Accuracy Check** - Rejects unreliable GPS readings
3. **Audit Trail** - All GPS coordinates logged
4. **Device Logging** - IP address and device info recorded
5. **Admin Control** - Only admin can configure locations

## Multi-Location Support

Support multiple office locations:
- Main Chamber
- Court Complexes
- Branch Offices
- Temporary Locations

Employee can check-in from any active location.

## Best Practices

1. **Set appropriate radius** - Not too small (hard to hit) or too large (defeats purpose)
2. **Test location accuracy** - Test GPS at office before deploying
3. **Handle edge cases** - Indoor GPS may be less accurate
4. **Monitor attendance** - Check for unusual patterns
5. **Update locations** - Keep locations accurate as office moves

## API Reference

### Check In
```
POST /api/attendance/checkin
Body: {
  latitude: number,
  longitude: number,
  accuracy: number
}
```

### Check Out
```
POST /api/attendance/checkout
Body: {
  latitude: number,
  longitude: number,
  accuracy: number
}
```

### Get Office Locations
```
GET /api/office-locations/active
```

Returns all active office locations for employees.

## Frontend Implementation

The frontend uses browser's `navigator.geolocation` API:

```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    // Send to backend
  },
  (error) => {
    // Handle error
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
);
```

## Mobile Support

The system works on:
- **Web browsers** (Chrome, Edge, Safari, Firefox)
- **Mobile browsers** (iOS Safari, Chrome Mobile)
- **PWA** (Progressive Web App)
- **React Native** (if mobile app is built)

For best accuracy on mobile:
- Use mobile browser (better GPS)
- Enable high-accuracy location
- Allow location permissions

## Privacy & Compliance

- GPS coordinates stored securely
- Only admin can view all locations
- Employees see only their own attendance
- All data encrypted in transit (HTTPS)
- Audit logs for compliance

## Future Enhancements

- [ ] Offline mode with sync
- [ ] Bluetooth beacon support
- [ ] WiFi network validation
- [ ] Biometric + GPS hybrid
- [ ] Location history map view
- [ ] Automatic location detection

