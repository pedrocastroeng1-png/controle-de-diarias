const fs = require('fs');

let manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf-8');
manifest = manifest.replace(
    /<uses-permission android:name="android\.permission\.INTERNET" \/>/,
    \`<uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />\`
);
fs.writeFileSync('android/app/src/main/AndroidManifest.xml', manifest);
console.log('Fixed manifest');
