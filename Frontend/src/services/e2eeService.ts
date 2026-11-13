import { apiClient } from './apiClient';

const DB_NAME = 'TeamSync_E2EE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'e2ee_keypairs';

// Mở hoặc khởi tạo IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Lưu cặp khóa của User vào IndexedDB theo userId
async function saveKeyPairToDB(userId: number, keyPair: CryptoKeyPair): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(keyPair, `keypair_${userId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Lấy cặp khóa của User từ IndexedDB
async function getKeyPairFromDB(userId: number): Promise<CryptoKeyPair | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(`keypair_${userId}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// 1. Sinh cặp khóa ECDH P-256
async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
}

// Export Public Key dạng Base64 SPKI
async function exportPublicKeyToBase64(key: CryptoKey): Promise<string> {
  const spkiBuffer = await window.crypto.subtle.exportKey('spki', key);
  const bytes = new Uint8Array(spkiBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Import chuỗi Base64 thành CryptoKey Public Key
async function importPublicKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const binary = window.atob(base64Key);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

// Cache lưu Shared Key theo key: `${myUserId}_${otherUserId}_${otherPublicKeyBase64}`
// Tự động vô hiệu hóa cache nếu đối phương cập nhật Public Key mới!
const sharedKeyCache = new Map<string, CryptoKey>();

async function deriveSharedKey(myPrivateKey: CryptoKey, theirPublicKey: CryptoKey): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: theirPublicKey,
    },
    myPrivateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Mã hóa tin nhắn AES-GCM 256
async function encryptMessage(text: string, sharedKey: CryptoKey): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes IV
  const encodedText = new TextEncoder().encode(text);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    encodedText
  );

  const cipherBytes = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return window.btoa(binary);
}

// Giải mã tin nhắn (có log cảnh báo nếu giải mã thất bại)
async function decryptMessage(encryptedBase64: string, sharedKey: CryptoKey): Promise<string> {
  try {
    const binary = window.atob(encryptedBase64);
    if (binary.length < 16) {
      // Quá ngắn, chắc chắn là plain text thường
      return encryptedBase64;
    }

    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      sharedKey,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    // Nếu là tin nhắn cũ dạng văn bản rõ hoặc sai khóa
    console.debug('[E2EE Decrypt Info] Không thể giải mã chuỗi, hiển thị fallback:', encryptedBase64.substring(0, 20) + '...', error);
    return encryptedBase64;
  }
}

export const e2eeService = {
  /**
   * Khởi tạo E2EE khi người dùng đăng nhập:
   * Luôn đảm bảo Public Key trên Server khớp 100% với Private Key trong máy!
   */
  async initE2EE(userId: number): Promise<CryptoKeyPair> {
    let keyPair = await getKeyPairFromDB(userId);
    if (!keyPair) {
      console.log('[E2EE] Chưa có cặp khóa trên máy, đang sinh mới...');
      keyPair = await generateECDHKeyPair();
      await saveKeyPairToDB(userId, keyPair);
    }

    // Luôn đồng bộ Public Key của máy hiện tại lên Server
    try {
      const publicKeyBase64 = await exportPublicKeyToBase64(keyPair.publicKey);
      await apiClient.put('/api/users/public-key', { publicKey: publicKeyBase64 });
      console.log('[E2EE] Đã đồng bộ Public Key lên Server thành công!');
    } catch (err) {
      console.error('[E2EE] Lỗi đồng bộ Public Key lên Server:', err);
    }

    return keyPair;
  },

  /**
   * Lấy Public Key mới nhất trực tiếp từ Server của một user
   */
  async fetchLatestPublicKey(userId: number): Promise<string | null> {
    try {
      const res = await apiClient.get<any>(`/api/users/${userId}/public-key`);
      const key = res?.publicKey || res?.data?.publicKey || null;
      return key;
    } catch (err) {
      console.warn(`[E2EE] Không thể lấy Public Key mới nhất của user ${userId}:`, err);
      return null;
    }
  },

  /**
   * Tính toán hoặc lấy Shared Key từ RAM cache
   */
  async getSharedKey(
    myUserId: number,
    otherUserId: number,
    otherPublicKeyBase64: string
  ): Promise<CryptoKey | null> {
    if (!otherPublicKeyBase64) return null;

    const cacheKey = `${myUserId}_${otherUserId}_${otherPublicKeyBase64}`;
    if (sharedKeyCache.has(cacheKey)) {
      return sharedKeyCache.get(cacheKey)!;
    }

    const myKeyPair = await getKeyPairFromDB(myUserId);
    if (!myKeyPair) {
      console.warn(`[E2EE] Không tìm thấy Private Key của user ${myUserId} trong IndexedDB!`);
      return null;
    }

    try {
      const theirPublicKey = await importPublicKeyFromBase64(otherPublicKeyBase64);
      const sharedKey = await deriveSharedKey(myKeyPair.privateKey, theirPublicKey);
      sharedKeyCache.set(cacheKey, sharedKey);
      return sharedKey;
    } catch (err) {
      console.error('[E2EE] Lỗi khi derive Shared Key:', err);
      return null;
    }
  },

  encryptMessage,
  decryptMessage,
};

export default e2eeService;
