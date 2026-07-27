import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import { Alert } from 'react-native';

const rnBiometrics = new ReactNativeBiometrics();

/**
 * Checks if the device supports biometric authentication (Fingerprint, FaceID, etc).
 */
export const checkBiometricSupport = async (): Promise<boolean> => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return available && (biometryType === BiometryTypes.TouchID || biometryType === BiometryTypes.FaceID || biometryType === BiometryTypes.Biometrics);
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
};
/**
 * Prompts biometric auth
 */
export const promptBiometricAuth = async (promptMessage: string): Promise<boolean> => {
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage });
    return success;
  } catch (error) {
    console.error('Biometric auth failed', error);
    return false;
  }
};

/**
 * Checks if there are credentials saved in the keychain.
 */
export const hasSavedCredentials = async (): Promise<boolean> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      authenticationPrompt: { title: 'Authenticate' },
    });
    return !!credentials;
  } catch (error) {
    return false;
  }
};

/**
 * Securely saves login credentials in the Keychain/Keystore.
 */
export const saveCredentials = async (identifier: string, password: string):Promise<boolean> => {
  try {
    const res = await Keychain.setGenericPassword(identifier, password, {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return !!res;
  } catch (error) {
    console.error('Failed to save credentials securely:', error);
    return false;
  }
};

/**
 * Securely retrieves login credentials if they exist and unlocks them.
 */
export const getSavedCredentials = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      authenticationPrompt: { title: 'Log in with Biometrics' },
    });
    if (credentials) {
      return {
        identifier: credentials.username,
        password: credentials.password
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve saved credentials:', error);
    return null;
  }
};

/**
 * Clears saved credentials.
 */
export const clearCredentials = async () => {
  try {
    await Keychain.resetGenericPassword();
  } catch (error) {
    console.error('Failed to clear credentials:', error);
  }
};
