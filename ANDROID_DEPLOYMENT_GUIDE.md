# Android Deployment Guide - School Bell Manager

## Prerequisites
- **Android Studio** installed on your computer
- **Node.js** (v16 or higher) installed
- **Git** installed
- Android device or emulator for testing

## Step-by-Step Instructions

### Step 1: Export Project to GitHub
1. In your Lovable project, look for the **GitHub** button in the top-right corner
2. Click **"Connect to GitHub"** if not already connected
3. Authorize the Lovable GitHub App when prompted
4. Select your GitHub account/organization
5. Click **"Create Repository"** to export your project code
6. Note down your repository URL (e.g., `https://github.com/yourusername/school-bell-manager`)

### Step 2: Clone and Setup Locally
1. Open terminal/command prompt on your computer
2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/school-bell-manager.git
   cd school-bell-manager
   ```
3. Install all dependencies:
   ```bash
   npm install
   ```

### Step 3: Add Android Platform
1. Add Android platform to your project:
   ```bash
   npx cap add android
   ```
2. Update the Android platform dependencies:
   ```bash
   npx cap update android
   ```

### Step 4: Build the Web App
1. Build the production version of your app:
   ```bash
   npm run build
   ```
   This creates the `dist` folder with your compiled web app.

### Step 5: Sync to Android
1. Sync the web app to the Android platform:
   ```bash
   npx cap sync
   ```
   This copies your web app into the Android project and updates native dependencies.

### Step 6: Run on Android Device

#### Option A: Using Capacitor CLI (Recommended)
1. Connect your Android device via USB and enable USB debugging, OR start an Android emulator
2. Run the app:
   ```bash
   npx cap run android
   ```
   This will open Android Studio and install the app on your device/emulator.

#### Option B: Using Android Studio
1. Open Android Studio:
   ```bash
   npx cap open android
   ```
2. In Android Studio:
   - Wait for Gradle sync to complete
   - Connect your Android device or start an emulator
   - Click the **Run** button (green play icon)
   - Select your device and click **OK**

## Building APK File

### For Testing (Debug APK)
1. Open Android Studio: `npx cap open android`
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete
4. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### For Production (Release APK)
1. Open Android Studio: `npx cap open android`
2. Go to **Build** → **Generate Signed Bundle / APK**
3. Select **APK** and click **Next**
4. Create a new keystore or use existing one:
   - **Key store path**: Choose location (e.g., `school-bell-keystore.jks`)
   - **Password**: Create a strong password
   - **Key alias**: `school-bell-key`
   - **Key password**: Same or different password
   - Fill in certificate information
5. Select **release** build variant
6. Click **Finish**
7. APK will be in: `android/app/release/app-release.apk`

## Troubleshooting

### Common Issues:
1. **"Android SDK not found"**: Install Android Studio and SDK
2. **"Device not found"**: Enable USB debugging on your Android device
3. **"Build failed"**: Run `npx cap sync` again after making changes
4. **"Permission denied"**: On Android device, allow installation from unknown sources

### After Making Changes:
1. Build the web app: `npm run build`
2. Sync to Android: `npx cap sync`
3. Run again: `npx cap run android`

## App Permissions
Your school bell app requires these permissions (already configured):
- **Bluetooth**: To connect with HC-05 module
- **Bluetooth Admin**: To manage Bluetooth connections
- **Access Fine Location**: Required for Bluetooth device discovery on Android 6+

## Testing Your App
1. **Bluetooth Connection**: Test connecting to your HC-05 module
2. **Schedule Management**: Add/edit bell schedules
3. **Holiday Management**: Add holidays to disable bells
4. **Time Display**: Verify current time shows correctly
5. **Data Sync**: Send schedules to Arduino and verify reception

## Next Steps
- Test all features with your Arduino setup
- Generate a signed release APK for distribution
- Consider publishing to Google Play Store if needed

---
**Need Help?** Check the [Lovable mobile development blog post](https://lovable.dev/blogs/TODO) for additional guidance.