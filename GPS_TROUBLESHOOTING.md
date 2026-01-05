# GPS Location Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue 1: "Location request timeout"

**Causes:**
- Weak GPS signal (indoors, basement, shielded area)
- Device GPS disabled
- Browser permission not granted
- Network location services unavailable

**Solutions:**
1. **Move to a better location:**
   - Go near a window
   - Step outside
   - Move to an open area

2. **Enable location services:**
   - **Windows:** Settings → Privacy → Location → On
   - **Mac:** System Preferences → Security & Privacy → Location Services → On
   - **Mobile:** Settings → Location Services → On

3. **Grant browser permission:**
   - Click the lock icon in browser address bar
   - Select "Allow" for location
   - Refresh the page

4. **Check browser settings:**
   - Chrome: Settings → Privacy and Security → Site Settings → Location
   - Firefox: Options → Privacy & Security → Permissions → Location
   - Edge: Settings → Site Permissions → Location

5. **Try these steps:**
   - Click "Get Location" button to retry
   - Wait up to 30 seconds (timeout increased)
   - Refresh the page and allow location access

### Issue 2: "Permission denied"

**Solution:**
1. Click browser's location permission prompt when it appears
2. If missed, check browser address bar for location icon
3. Manually allow in browser settings
4. Refresh the page

### Issue 3: "Location information unavailable"

**Causes:**
- GPS hardware issue
- Location services disabled at OS level
- Browser not supported

**Solutions:**
1. Enable device location services (see Issue 1)
2. Use a modern browser (Chrome, Firefox, Edge)
3. Try a different device
4. Check if GPS works in other apps

### Issue 4: Low Accuracy (>50 meters)

**Causes:**
- Indoor location using Wi-Fi/cell towers
- Weak GPS signal

**Solutions:**
1. Move to an area with better GPS signal
2. Wait a few seconds for GPS to stabilize
3. Click "Get Location" again

## 📱 Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Best support |
| Firefox | ✅ | ✅ | Good support |
| Edge | ✅ | ✅ | Good support |
| Safari | ✅ | ✅ | iOS 13+ |
| Opera | ✅ | ⚠️ | Limited on mobile |

## 🌐 HTTPS Requirement

**Important:** Modern browsers require HTTPS for geolocation API, except:
- ✅ `localhost`
- ✅ `127.0.0.1`
- ❌ Local IP addresses (e.g., `192.168.x.x`)

**Solution for local development:**
- Use `localhost:3006` instead of IP address
- Or set up HTTPS certificate for local development

## 🔧 Technical Details

### Timeout Settings
- **Previous:** 10 seconds
- **Current:** 30 seconds (improved)

### Accuracy Requirements
- Maximum accepted: 50 meters
- Ideal: < 20 meters (GPS outdoors)
- Acceptable: 20-50 meters (GPS indoors/Wi-Fi)

### Location Sources (priority order)
1. GPS satellites (most accurate, requires clear sky view)
2. Wi-Fi positioning (moderate accuracy)
3. Cell tower triangulation (least accurate)

## ✅ Quick Checklist

Before reporting an issue, check:
- [ ] Location services enabled on device
- [ ] Browser permission granted
- [ ] Using HTTPS or localhost
- [ ] In area with GPS signal (try near window/outside)
- [ ] Using supported browser
- [ ] Clicked "Get Location" button
- [ ] Waited at least 30 seconds
- [ ] Refreshed page and re-allowed permission

## 📞 Still Having Issues?

If GPS still doesn't work after trying all solutions:
1. Check browser console for errors (F12)
2. Try a different browser
3. Test on a different device
4. Verify office locations are configured in admin panel
5. Contact administrator if office location setup is needed

## 🔒 Privacy Note

- Location data is only used for attendance verification
- Coordinates are stored securely
- Only admin can view attendance location data
- GPS is not tracked continuously, only at check-in/out

