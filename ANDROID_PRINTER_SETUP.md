# Android Tablet & Moka Printer Setup Guide

## 📱 Android Tablet Configuration

### Requirements
- Android tablet (Android 8.0+)
- Chrome browser (recommended) or any modern browser
- Internet connection
- Moka POS printer device

### Option 1: Progressive Web App (PWA) - Recommended ⭐

1. **Open POS in Chrome**
   ```
   https://your-domain.com/pos/frontend/index.html
   ```

2. **Install as App**
   - Tap the menu (3 dots) in Chrome
   - Select "Add to Home Screen" or "Install App"
   - Give it a name (e.g., "NASHTY POS")
   - Tap "Add"

3. **Launch App**
   - Find NASHTY icon on home screen
   - Tap to open (will run in standalone mode)
   - App runs fullscreen without browser UI

### Option 2: Custom Android WebView App

If you need native printer integration, create a simple WebView wrapper:

#### Step 1: Create Android Project

```java
// MainActivity.java
package com.nashty.pos;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.JavascriptInterface;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private MokaPrinterService printerService;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize WebView
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        
        // Initialize Moka printer
        printerService = new MokaPrinterService(this);
        
        // Add JavaScript interface for printer
        webView.addJavascriptInterface(new PrinterInterface(), "Android");
        
        // Load POS application
        webView.loadUrl("https://your-domain.com/pos/frontend/index.html");
        
        setContentView(webView);
    }
    
    // JavaScript Interface for printing
    public class PrinterInterface {
        @JavascriptInterface
        public void print(String receiptData) {
            runOnUiThread(() -> {
                try {
                    printerService.print(receiptData);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
        
        @JavascriptInterface
        public boolean isPrinterAvailable() {
            return printerService.isConnected();
        }
    }
}
```

#### Step 2: Add Dependencies (build.gradle)

```gradle
dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.8.0'
    
    // Moka SDK (if available)
    // implementation 'com.moka:printer-sdk:x.x.x'
}
```

#### Step 3: AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    
    <application
        android:label="NASHTY POS"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:screenOrientation="landscape"
            android:configChanges="orientation|screenSize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## 🖨️ Moka Printer Integration

### Printer Connection Methods

#### Method 1: Bluetooth Connection

1. **Enable Bluetooth on tablet**
2. **Pair with Moka printer**
   - Go to Settings > Bluetooth
   - Find Moka printer device
   - Tap to pair (PIN: usually 0000 or 1234)

3. **Verify connection**
   - Printer should show as "Connected"
   - Test print from Moka app if available

#### Method 2: USB Connection (if supported)

1. Connect printer via USB-C or micro-USB
2. Android should auto-detect
3. Grant USB permissions when prompted

### Printer Commands

The system uses ESC/POS commands for Moka printers:

- `[C]` - Center align
- `[L]` - Left align  
- `[R]` - Right align
- `[B]` - Bold text
- `[IMG]url` - Print image
- `[CUT]` - Cut paper

### Testing the Printer

1. **Open POS app**
2. **Open browser console** (if in Chrome)
3. **Run test command**:
   ```javascript
   window.androidPrinter.testPrint()
   ```
4. **Verify receipt prints**

Expected output:
```
TEST PRINT
Test Restaurant Address
0812-3456-7890
================================
No Order: TEST-xxxxxxxxxxxx
Tanggal: [current date/time]
...
```

## 🔧 Troubleshooting

### Printer Not Detected

**Check:**
- Bluetooth is ON
- Printer is powered ON
- Printer is paired in Android Bluetooth settings
- App has Bluetooth permissions

**Solution:**
```bash
# Un-pair and re-pair printer
Settings > Bluetooth > Forget device > Pair again
```

### Print Not Working

**Check browser console:**
```javascript
// Check if printer interface available
console.log('Printer available:', window.androidPrinter.isAvailable());

// Check Android interface
console.log('Android object:', typeof Android);
console.log('Android.print:', typeof Android?.print);
```

**Solutions:**
1. If `Android` undefined → Use PWA with web print fallback
2. If printer unavailable → Check Bluetooth connection
3. If print fails → Restart printer and tablet

### Web Fallback Not Working

**Enable pop-ups:**
- Settings > Site settings > Pop-ups → Allow
- Try print again

### Receipt Not Formatting Correctly

**Check paper width:**
- Moka typically uses 58mm thermal paper
- Adjust CSS in `android-printer.js` if needed

## 📊 Performance Tips

### For Best Performance:

1. **Use landscape orientation**
   - Better for POS layout
   - More screen real estate

2. **Clear cache regularly**
   - Settings > Apps > Chrome > Storage > Clear cache
   - Do weekly for best performance

3. **Close unused apps**
   - Keep only POS running
   - Disable background apps

4. **Stable internet connection**
   - Use WiFi (preferred)
   - Or stable 4G connection
   - Minimum 5 Mbps recommended

5. **Keep Android updated**
   - Android 10+ recommended
   - Update Chrome to latest version

## 🔐 Security Tips

1. **Lock tablet when not in use**
2. **Use strong PIN/password**
3. **Enable auto-lock (5 minutes)**
4. **Don't install unknown apps**
5. **Regular security updates**

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| App crashes | Clear cache, restart tablet |
| Slow performance | Close other apps, clear cache |
| Printer offline | Check Bluetooth, restart printer |
| Print doesn't start | Check permissions, restart app |
| Receipt garbled | Check paper width setting |

### Get Help

1. Check browser console for errors
2. Try test print command
3. Verify printer connection in Android settings
4. Contact Moka support for printer issues

## ✅ Quick Setup Checklist

- [ ] Android 8.0+ tablet ready
- [ ] Chrome browser installed/updated
- [ ] Moka printer powered on
- [ ] Bluetooth enabled and paired
- [ ] POS URL bookmarked or installed as PWA
- [ ] Test print successful
- [ ] Staff trained on basic troubleshooting

---

**Ready to go! 🚀**

For production use, ensure stable internet and keep printer within Bluetooth range (< 10 meters).
