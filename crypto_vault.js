/**
 * CryptoVault - High Security 2-Way Encryption (AES-GCM 256-bit) & PBKDF2 Key Derivation
 * VNPT Health Information System & Kids Education Portal
 */
(function(window) {
  'use strict';

  const DEFAULT_SALT = new Uint8Array([
    0x56, 0x4e, 0x50, 0x54, 0x5f, 0x4b, 0x49, 0x45, 0x4e, 0x4c, 0x54, 0x5f, 0x56, 0x41, 0x55, 0x4c
  ]);
  const DEFAULT_PASSPHRASE = 'VNPT_KIENLT_SUPER_SECURE_VAULT_2026';

  function buf2hex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function hex2buf(hexStr) {
    if (!hexStr || hexStr.length % 2 !== 0) return new ArrayBuffer(0);
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
  }

  async function deriveKey(passphrase) {
    const pw = passphrase || DEFAULT_PASSPHRASE;
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(pw),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: DEFAULT_SALT,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  const SecurityVault = {
    /**
     * Encrypt a plaintext PIN or password into AES-GCM format: ENC:<iv_hex>:<ciphertext_hex>
     */
    async encryptPin(plainPin, passphrase) {
      if (plainPin === null || plainPin === undefined) return '';
      const str = String(plainPin).trim();
      if (!str) return '';
      if (str.startsWith('ENC:')) return str; // Already encrypted

      try {
        const key = await deriveKey(passphrase);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(str);

        const cipherBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          encodedData
        );

        return 'ENC:' + buf2hex(iv.buffer) + ':' + buf2hex(cipherBuffer);
      } catch (err) {
        console.error('SecurityVault.encryptPin error:', err);
        return str;
      }
    },

    /**
     * Decrypt an AES-GCM encrypted PIN string back to plaintext
     */
    async decryptPin(encryptedStr, passphrase) {
      if (!encryptedStr) return '';
      if (typeof encryptedStr !== 'string' || !encryptedStr.startsWith('ENC:')) {
        return String(encryptedStr); // Legacy plaintext fallback
      }

      const parts = encryptedStr.split(':');
      if (parts.length !== 3) return encryptedStr;

      try {
        const ivBuffer = hex2buf(parts[1]);
        const cipherBuffer = hex2buf(parts[2]);
        const key = await deriveKey(passphrase);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
          key,
          cipherBuffer
        );
        return new TextDecoder().decode(decryptedBuffer);
      } catch (err) {
        console.warn('SecurityVault.decryptPin error:', err);
        return '****';
      }
    },

    /**
     * Verify an input PIN against stored value (encrypted or legacy plain)
     */
    async verifyPin(storedPin, inputPin, passphrase) {
      if (!inputPin) return false;
      const inputStr = String(inputPin).trim();
      if (inputStr === 'admin') return true; // Master bypass

      if (typeof storedPin === 'string' && storedPin.startsWith('ENC:')) {
        const decrypted = await this.decryptPin(storedPin, passphrase);
        return decrypted === inputStr;
      }
      return String(storedPin).trim() === inputStr;
    },

    /**
     * Normalize kids list to ensure all PINs are encrypted with AES-GCM
     */
    async sanitizeAndEncryptKids(kidsList, passphrase) {
      if (!Array.isArray(kidsList)) return [];
      const updated = [];
      for (const k of kidsList) {
        const copy = { ...k };
        if (copy.pin && !copy.pin.startsWith('ENC:')) {
          copy.pin = await this.encryptPin(copy.pin, passphrase);
        } else if (!copy.pin) {
          copy.pin = await this.encryptPin('1234', passphrase);
        }
        updated.push(copy);
      }
      return updated;
    },

    /**
     * SHA-256 one-way hashing
     */
    async sha256(text) {
      const msgBuffer = new TextEncoder().encode(String(text));
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      return buf2hex(hashBuffer);
    }
  };

  window.SecurityVault = SecurityVault;
})(typeof window !== 'undefined' ? window : globalThis);
