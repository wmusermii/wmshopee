import { base64url, EncryptJWT, jwtDecrypt, JWTPayload, jwtVerify, SignJWT } from "jose";
import { logError, logInfo } from "./logger";
// import dotenv from "dotenv";
// import { env } from "../config/env";

// dotenv.config();
const SECRET = "ajinomotocapmangkokmerahdelimaputihputihmel";
const secretKey = base64url.decode(SECRET);
export class EncryptDecryptJwt {
 // 🔹 Enkripsi Payload menjadi JWT
  static async encrypt(payload: JWTPayload): Promise<string> {
    return await new EncryptJWT(payload)
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime("35m")
      .encrypt(secretKey);
  }
  // 🔹 Dekripsi & Verifikasi JWT
  static async decrypt(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtDecrypt(token, secretKey);
      return payload; // Berhasil didecrypt
    } catch (error) {
      // console.error("Token tidak valid:", error);
      return null; // Token tidak valid atau sudah expired
    }
  }
  // 🔹 Verifikasi Token (Cek apakah masih valid)
  static async verify(token: string): Promise<boolean> {
    return !!(await this.decrypt(token)); // Jika decrypt berhasil, token valid
  }

  static async generateToken(userData: any): Promise<string> {

    return await new SignJWT(userData)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime("60m") // Token berlaku selama 60 m
      .sign(secretKey);
  };
  static async verifyToken(token: string):Promise<any>{
    try {
      // logInfo(token);
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ['HS256'] // Pastikan algoritma sama dengan yang digunakan saat sign
      });
      return payload; // Berisi data yang ada di token
    } catch (error) {
      // logError("Error Encrypt ",error)
      return error;
      // throw new Error('Token tidak valid atau sudah kedaluwarsa');
    }
  };
}
