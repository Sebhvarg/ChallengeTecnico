import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

export class StorageTamperedError extends Error {
  constructor(message: string = 'Se detectó una alteración no autorizada en los datos de la sesión.') {
    super(message);
    this.name = 'StorageTamperedError';
  }
}

interface EncryptedEnvelope {
  payload: string;   // Texto cifrado con AES
  signature: string; // Firma HMAC-SHA256 para verificación de integridad estricta
  iv: string;        // Vector de inicialización
  timestamp: number; // Marca temporal
}

@Injectable({
  providedIn: 'root'
})
export class CryptoStorageService {
  // Clave compartida con el Backend (.NET) para descifrado de red y sesión
  private readonly NETWORK_KEY_SECRET = 'Cachy0S$PruebaB6GyS3ba4stianH0lg++n200216202204!';
  
  // Claves de bóveda para el sessionStorage local
  private readonly SECRET_KEY = 'Cachy0S$StorageSecretKey_Challenge_2026!#SecureClientVault';
  private readonly HMAC_KEY = 'HmacKey_IntegrityVerification_9988776655!@#';

  private onTamperCallback?: () => void;

  setTamperListener(callback: () => void): void {
    this.onTamperCallback = callback;
  }

  /**
   * Descifra el payload que llega cifrado desde el Backend (.NET) por la consola de red.
   */
  decryptNetworkPayload<T>(payloadBase64: string, ivHex: string): T {
    try {
      const key = CryptoJS.SHA256(this.NETWORK_KEY_SECRET);
      const iv = CryptoJS.enc.Hex.parse(ivHex);

      const decrypted = CryptoJS.AES.decrypt(payloadBase64, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const jsonStr = decrypted.toString(CryptoJS.enc.Utf8);
      if (!jsonStr) {
        throw new Error('Fallo al descifrar el payload de la red.');
      }

      return JSON.parse(jsonStr) as T;
    } catch (err) {
      console.error('[CryptoStorage] Error al descifrar payload de red:', err);
      throw err;
    }
  }

  /**
   * Guarda un elemento en sessionStorage cifrado con AES-256 y firmado con HMAC.
   */
  setItem<T>(key: string, value: T): void {
    try {
      const jsonString = JSON.stringify(value);
      const iv = CryptoJS.lib.WordArray.random(16);
      
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.SECRET_KEY, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const payloadBase64 = encrypted.toString();
      const ivHex = iv.toString(CryptoJS.enc.Hex);

      // Calcular firma digital HMAC para garantizar que nadie altere la cadena en DevTools
      const signature = CryptoJS.HmacSHA256(`${payloadBase64}:${ivHex}`, this.HMAC_KEY).toString();

      const envelope: EncryptedEnvelope = {
        payload: payloadBase64,
        signature: signature,
        iv: ivHex,
        timestamp: Date.now()
      };

      sessionStorage.setItem(key, JSON.stringify(envelope));
    } catch (err) {
      console.error(`[CryptoStorage] Error al cifrar ${key}:`, err);
    }
  }

  /**
   * Obtiene y desencripta un elemento de sessionStorage.
   * Si los datos fueron manipulados en DevTools, detecta la corrupción y lanza alerta.
   */
  getItem<T>(key: string): T | null {
    const rawEnvelope = sessionStorage.getItem(key);
    if (!rawEnvelope) {
      return null;
    }

    try {
      let envelope: EncryptedEnvelope;
      try {
        envelope = JSON.parse(rawEnvelope);
      } catch {
        this.notifyTamper();
        throw new StorageTamperedError(`El formato de la clave ${key} fue manipulado.`);
      }

      if (!envelope.payload || !envelope.signature || !envelope.iv) {
        this.notifyTamper();
        throw new StorageTamperedError(`Estructura inválida en ${key}.`);
      }

      // 1. Verificar firma HMAC de integridad
      const expectedSignature = CryptoJS.HmacSHA256(`${envelope.payload}:${envelope.iv}`, this.HMAC_KEY).toString();
      if (envelope.signature !== expectedSignature) {
        this.notifyTamper();
        throw new StorageTamperedError(`Firma HMAC inválida en ${key}: Datos manipulados.`);
      }

      // 2. Desencriptar AES
      const iv = CryptoJS.enc.Hex.parse(envelope.iv);
      const decrypted = CryptoJS.AES.decrypt(envelope.payload, this.SECRET_KEY, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedText) {
        this.notifyTamper();
        throw new StorageTamperedError(`Fallo de descifrado en ${key}. Posible manipulación de clave.`);
      }

      return JSON.parse(decryptedText) as T;
    } catch (error) {
      if (error instanceof StorageTamperedError) {
        throw error;
      }
      this.notifyTamper();
      throw new StorageTamperedError(`Error inesperado al validar ${key}.`);
    }
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }

  /**
   * Verifica la integridad de todas las claves sensibles de la sesión.
   */
  checkIntegrity(keys: string[]): boolean {
    for (const key of keys) {
      if (sessionStorage.getItem(key)) {
        try {
          this.getItem(key);
        } catch {
          return false;
        }
      }
    }
    return true;
  }

  private notifyTamper(): void {
    if (this.onTamperCallback) {
      this.onTamperCallback();
    }
  }
}
