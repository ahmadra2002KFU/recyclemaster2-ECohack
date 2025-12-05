import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.recyclemaster.app',
  appName: 'RecycleMaster',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'recyclemaster',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for RecycleMaster'
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for RecycleMaster'
      }
    }
  }
};

export default config;
