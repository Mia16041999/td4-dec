import { webcrypto } from "crypto";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: { name: "SHA-256" },
      },
      true,
      ["encrypt", "decrypt"]
  );
  return { publicKey, privateKey };
}

export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exportedKey);
}

export async function exportPrvKey(
    key: webcrypto.CryptoKey | null
): Promise<string | null> {
  if (key === null) {
    return null;
  }
  const exportedKey = await webcrypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exportedKey);
}

export async function importPubKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {

  const keyBuffer = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
      "spki",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
  );
}

export async function importPrvKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
  );
}

export async function rsaEncrypt(
    b64Data: string,
    strPublicKey: string
): Promise<string> {
  const data = base64ToArrayBuffer(b64Data);
  const publicKey = await importPubKey(strPublicKey);
  const encryptedData = await webcrypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      data
  );
  return arrayBufferToBase64(encryptedData);
}

export async function rsaDecrypt(
    data: string,
    privateKey: webcrypto.CryptoKey
): Promise<string> {
  const encryptedData = base64ToArrayBuffer(data);
  const decryptedData = await webcrypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedData
  );
  return arrayBufferToBase64(decryptedData);
}

export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  const key = await crypto.subtle.generateKey(
      {
        name: "AES-CBC",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
  );

  return key;
}


export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exportedKey);
}

export async function importSymKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(strKey);
  const key = await webcrypto.subtle.importKey(
      "raw",
      keyBuffer,
      {
        name: "AES-CBC",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
  );
  return key;
}

export async function symEncrypt(
    key: webcrypto.CryptoKey,
    data: string
): Promise<string> {


  const dataUint8Array = new TextEncoder().encode(data);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encryptedData = await webcrypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      key,
      dataUint8Array
  );
  const concatenatedData = new Uint8Array([...iv, ...new Uint8Array(encryptedData)]);
  const base64EncryptedData = arrayBufferToBase64(concatenatedData.buffer);
  return base64EncryptedData;
}

export async function symDecrypt(
    strKey: string,
    encryptedData: string
): Promise<string> {
  const key = await importSymKey(strKey);
  const encryptedDataBuffer = base64ToArrayBuffer(encryptedData);
  const iv = encryptedDataBuffer.slice(0, 16);
  const decryptedDataBuffer = await webcrypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      key,
      encryptedDataBuffer.slice(16)
  );

  const decryptedDataString = new TextDecoder().decode(decryptedDataBuffer);

  return decryptedDataString;
}