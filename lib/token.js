import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const SECRET_KEY = "dramabox_secret_2024";
const APP_VERSION = "430";
const APP_VERSION_NAME = "4.3.0";
const PACKAGE_NAME = "com.storymatrix.drama";
const CID = "DRA1000042";

export function generateDeviceId() {
  return uuidv4().replace(/-/g, '').substring(0, 32);
}

export function generateToken(deviceId) {
  const timestamp = Date.now().toString();
  const data = `${deviceId}${timestamp}${SECRET_KEY}`;
  const hash = CryptoJS.MD5(data).toString();
  return {
    token: hash,
    deviceId: deviceId,
    timestamp: timestamp
  };
}

export function getHeaders(tokenData) {
  return {
    "User-Agent": "okhttp/4.10.0",
    "Accept-Encoding": "gzip",
    "Content-Type": "application/json",
    "tn": `Bearer ${tokenData.token}`,
    "version": APP_VERSION,
    "vn": APP_VERSION_NAME,
    "cid": CID,
    "package-name": PACKAGE_NAME,
    "apn": "1",
    "device-id": tokenData.deviceId,
    "language": "in",
    "current-language": "in",
    "p": "43",
    "time-zone": "+0700"
  };
}

export default { generateDeviceId, generateToken, getHeaders };
