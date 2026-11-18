// Service quản lý mã hóa đầu cuối E2EE: cặp khóa ECDH P-256, chia sẻ khóa nhóm K_nhom, mã hóa AES-GCM và sao lưu PIN PBKDF2
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

// Lưu K_nhom vào IndexedDB theo userId và conversationId
async function saveGroupKeyToDB(userId: number, conversationId: number, key: CryptoKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(key, `groupkey_${userId}_${conversationId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Lấy K_nhom từ IndexedDB theo userId và conversationId
async function getGroupKeyFromDB(userId: number, conversationId: number): Promise<CryptoKey | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(`groupkey_${userId}_${conversationId}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// 1. Sinh cặp khóa ECDH P-256 cho người dùng
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

// Sinh K_nhom đối xứng AES-GCM 256-bit
async function generateGroupKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable để bọc và phân phối
    ['encrypt', 'decrypt']
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

// Export K_nhom sang Base64
async function exportGroupKeyToBase64(key: CryptoKey): Promise<string> {
  const rawBuffer = await window.crypto.subtle.exportKey('raw', key);
  const bytes = new Uint8Array(rawBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Import Base64 thành K_nhom AES-GCM
async function importGroupKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const binary = window.atob(base64Key);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'raw',
    bytes.buffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Cache lưu Shared Key 1-1 theo key: `${myUserId}_${otherUserId}_${otherPublicKeyBase64}`
const sharedKeyCache = new Map<string, CryptoKey>();

// Cache lưu K_nhom theo key: `${userId}_${conversationId}`
const groupKeyCache = new Map<string, CryptoKey>();

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

// Mã hóa tin nhắn hoặc chuỗi bằng AES-GCM 256 với 12 bytes IV
async function encryptMessage(text: string, key: CryptoKey): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
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

// Giải mã chuỗi đã mã hóa bằng AES-GCM 256
async function decryptMessage(encryptedBase64: string, key: CryptoKey): Promise<string> {
  try {
    const binary = window.atob(encryptedBase64);
    if (binary.length < 16) {
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
      key,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.debug('[E2EE Decrypt Info] Không thể giải mã chuỗi, hiển thị fallback:', encryptedBase64.substring(0, 20) + '...', error);
    return encryptedBase64;
  }
}

// Bọc K_nhom cho một thành viên bằng ECDH Shared Key
async function wrapGroupKey(
  myPrivateKey: CryptoKey,
  recipientPublicKeyBase64: string,
  groupKey: CryptoKey
): Promise<string> {
  const theirPubKey = await importPublicKeyFromBase64(recipientPublicKeyBase64);
  const sharedKey = await deriveSharedKey(myPrivateKey, theirPubKey);
  const rawBase64 = await exportGroupKeyToBase64(groupKey);
  return await encryptMessage(rawBase64, sharedKey);
}

// Mở bọc K_nhom nhận được từ sender
async function unwrapGroupKey(
  myPrivateKey: CryptoKey,
  senderPublicKeyBase64: string,
  encryptedGroupKey: string
): Promise<CryptoKey> {
  const senderPubKey = await importPublicKeyFromBase64(senderPublicKeyBase64);
  const sharedKey = await deriveSharedKey(myPrivateKey, senderPubKey);
  const rawBase64 = await decryptMessage(encryptedGroupKey, sharedKey);
  return await importGroupKeyFromBase64(rawBase64);
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
   * Tính toán hoặc lấy Shared Key 1-1 từ RAM cache
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

  /**
   * Lấy hoặc sinh mới K_nhom (Lazy on-demand initialization)
   */
  async getOrFetchGroupKey(
    conversationId: number,
    currentUserId: number,
    members?: Array<{ userId: number; publicKey?: string | null }>
  ): Promise<CryptoKey | null> {
    const cacheKey = `${currentUserId}_${conversationId}`;
    if (groupKeyCache.has(cacheKey)) {
      return groupKeyCache.get(cacheKey)!;
    }

    const dbKey = await getGroupKeyFromDB(currentUserId, conversationId);
    if (dbKey) {
      groupKeyCache.set(cacheKey, dbKey);
      return dbKey;
    }

    const myKeyPair = await getKeyPairFromDB(currentUserId);
    if (!myKeyPair) {
      console.warn(`[E2EE] Không tìm thấy Private Key của user ${currentUserId} trong IndexedDB`);
      return null;
    }

    // 1. Thử lấy key đã được phân phối trên Server
    try {
      const res = await apiClient.get<any>(`/api/conversations/group/${conversationId}/key`);
      const keyData = res?.data || res;
      if (keyData && keyData.encryptedKey && keyData.senderId) {
        let senderPubKey = members?.find((m) => m.userId === keyData.senderId)?.publicKey;
        if (!senderPubKey) {
          senderPubKey = await e2eeService.fetchLatestPublicKey(keyData.senderId);
        }
        if (senderPubKey) {
          const unwrapped = await unwrapGroupKey(myKeyPair.privateKey, senderPubKey, keyData.encryptedKey);
          await saveGroupKeyToDB(currentUserId, conversationId, unwrapped);
          groupKeyCache.set(cacheKey, unwrapped);
          return unwrapped;
        }
      }
    } catch {
      // Nhóm chưa có key trên server
    }

    // 2. Chưa có key trên server -> Sinh mới K_nhom và bọc gửi cho tất cả thành viên
    try {
      const newGroupKey = await generateGroupKey();
      const keys: Array<{ recipientId: number; encryptedKey: string }> = [];
      const memberList = members && members.length > 0 ? members : [];

      for (const m of memberList) {
        let pubKey = m.publicKey;
        if (!pubKey) {
          pubKey = await e2eeService.fetchLatestPublicKey(m.userId);
        }
        if (pubKey) {
          try {
            const encKey = await wrapGroupKey(myKeyPair.privateKey, pubKey, newGroupKey);
            keys.push({ recipientId: m.userId, encryptedKey: encKey });
          } catch (wrapErr) {
            console.warn(`[E2EE] Không thể bọc K_nhom cho member ${m.userId}:`, wrapErr);
          }
        }
      }

      // Đảm bảo chính người gửi cũng có bản bọc key của mình để đồng bộ trên các thiết bị khác
      const hasSelf = keys.some((k) => k.recipientId === currentUserId);
      if (!hasSelf) {
        const myPubKeyBase64 = await exportPublicKeyToBase64(myKeyPair.publicKey);
        const selfEncKey = await wrapGroupKey(myKeyPair.privateKey, myPubKeyBase64, newGroupKey);
        keys.push({ recipientId: currentUserId, encryptedKey: selfEncKey });
      }

      if (keys.length > 0) {
        await apiClient.post(`/api/conversations/group/${conversationId}/keys`, {
          keyVersion: 1,
          keys,
        });
      }

      await saveGroupKeyToDB(currentUserId, conversationId, newGroupKey);
      groupKeyCache.set(cacheKey, newGroupKey);
      return newGroupKey;
    } catch (err) {
      console.error(`[E2EE] Lỗi sinh hoặc phân phối K_nhom cho nhóm ${conversationId}:`, err);
      return null;
    }
  },

  /**
   * Phân phối K_nhom cho thành viên mới được thêm vào nhóm
   */
  async distributeKeyToNewMembers(
    conversationId: number,
    currentUserId: number,
    newMembers: Array<{ userId: number; publicKey?: string | null }>
  ): Promise<void> {
    const groupKey = await this.getOrFetchGroupKey(conversationId, currentUserId);
    if (!groupKey) return;
    const myKeyPair = await getKeyPairFromDB(currentUserId);
    if (!myKeyPair) return;

    const keys: Array<{ recipientId: number; encryptedKey: string }> = [];
    for (const m of newMembers) {
      let pubKey = m.publicKey;
      if (!pubKey) {
        pubKey = await this.fetchLatestPublicKey(m.userId);
      }
      if (pubKey) {
        try {
          const encKey = await wrapGroupKey(myKeyPair.privateKey, pubKey, groupKey);
          keys.push({ recipientId: m.userId, encryptedKey: encKey });
        } catch (err) {
          console.warn(`[E2EE] Lỗi bọc K_nhom cho member mới ${m.userId}:`, err);
        }
      }
    }

    if (keys.length > 0) {
      await apiClient.post(`/api/conversations/group/${conversationId}/keys`, {
        keyVersion: 1,
        keys,
      });
    }
  },

  /**
   * Xử lý khi nhận được WebSocket event GROUP_KEY_DISTRIBUTE
   */
  async handleReceivedGroupKey(
    event: { conversationId: number; recipientId: number; senderId: number; encryptedKey: string; keyVersion: number },
    currentUserId: number
  ): Promise<void> {
    if (event.recipientId !== currentUserId) return;
    const myKeyPair = await getKeyPairFromDB(currentUserId);
    if (!myKeyPair) return;

    try {
      const senderPubKey = await this.fetchLatestPublicKey(event.senderId);
      if (!senderPubKey) return;

      const groupKey = await unwrapGroupKey(myKeyPair.privateKey, senderPubKey, event.encryptedKey);
      await saveGroupKeyToDB(currentUserId, event.conversationId, groupKey);
      const cacheKey = `${currentUserId}_${event.conversationId}`;
      groupKeyCache.set(cacheKey, groupKey);
      console.log(`[E2EE] Đã giải mã và lưu K_nhom cho nhóm ${event.conversationId} thành công!`);
    } catch (err) {
      console.error(`[E2EE] Lỗi giải mã K_nhom từ sender ${event.senderId}:`, err);
    }
  },

  /**
   * Sao lưu cặp khóa E2EE lên server bằng mã PIN (PBKDF2 + AES-GCM)
   */
  async backupPrivateKeyWithPin(userId: number, pin: string): Promise<boolean> {
    try {
      const keyPair = await getKeyPairFromDB(userId);
      if (!keyPair) {
        console.warn(`[E2EE Backup] Không tìm thấy cặp khóa của user ${userId}`);
        return false;
      }

      const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
      const pubJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const payloadJson = JSON.stringify({ privateKey: privJwk, publicKey: pubJwk });

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');

      const pinKeyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(pin),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      const aesKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        pinKeyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const encryptedPrivateKey = await encryptMessage(payloadJson, aesKey);
      await apiClient.post('/api/e2ee/backup', {
        encryptedPrivateKey,
        backupSalt: saltHex,
      });

      console.log('[E2EE Backup] Sao lưu khóa E2EE bằng mã PIN thành công!');
      return true;
    } catch (err) {
      console.error('[E2EE Backup] Thất bại khi sao lưu khóa E2EE:', err);
      return false;
    }
  },

  /**
   * Khôi phục cặp khóa E2EE từ server bằng mã PIN
   */
  async restorePrivateKeyWithPin(userId: number, pin: string): Promise<boolean> {
    try {
      const res = await apiClient.get<any>('/api/e2ee/backup');
      const backup = res?.data || res;
      if (!backup || !backup.hasBackup || !backup.encryptedPrivateKey || !backup.backupSalt) {
        console.warn('[E2EE Restore] Người dùng chưa có bản sao lưu trên server');
        return false;
      }

      const saltHex = backup.backupSalt as string;
      const saltBytes = new Uint8Array(
        (saltHex.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
      );

      const pinKeyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(pin),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      const aesKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 100000,
          hash: 'SHA-256',
        },
        pinKeyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const decryptedJson = await decryptMessage(backup.encryptedPrivateKey, aesKey);
      const data = JSON.parse(decryptedJson);

      if (!data.privateKey || !data.publicKey) {
        throw new Error('Dữ liệu sao lưu không hợp lệ');
      }

      const privateKey = await window.crypto.subtle.importKey(
        'jwk',
        data.privateKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );

      const publicKey = await window.crypto.subtle.importKey(
        'jwk',
        data.publicKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      );

      const restoredKeyPair: CryptoKeyPair = { privateKey, publicKey };
      await saveKeyPairToDB(userId, restoredKeyPair);

      const publicKeyBase64 = await exportPublicKeyToBase64(publicKey);
      await apiClient.put('/api/users/public-key', { publicKey: publicKeyBase64 });

      console.log('[E2EE Restore] Khôi phục cặp khóa E2EE bằng mã PIN thành công!');
      return true;
    } catch (err) {
      console.error('[E2EE Restore] Lỗi khi khôi phục cặp khóa E2EE:', err);
      return false;
    }
  },

  /**
   * Kiểm tra xem user có khóa riêng tư lưu trong IndexedDB không
   */
  async hasLocalKeyPair(userId: number): Promise<boolean> {
    const keyPair = await getKeyPairFromDB(userId);
    return keyPair !== null;
  },

  encryptMessage,
  decryptMessage,
  wrapGroupKey,
  unwrapGroupKey,
  generateGroupKey,
  exportGroupKeyToBase64,
  importGroupKeyFromBase64,
};

export default e2eeService;
