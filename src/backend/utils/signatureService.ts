import crypto from 'crypto';
import moment from 'moment';
import { logError, logInfo } from './logger';
class SignatureService {
    private clientKey: string;
    private privateKey: string;
    private secretKey: string;

    constructor(clientKey: string, privateKey: string, secretKey: string) {
        this.clientKey = clientKey;
        this.privateKey = privateKey;
        this.secretKey = secretKey;
    }

    // Function to create RSA-SHA256 Signature
    async createSignature(privateKey: string, stringToSign: string): Promise<string> {
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(stringToSign);
            sign.end();
            const signature = sign.sign(privateKey, 'hex');
            return signature;
        } catch (error) {
            logError(JSON.stringify(error))
            return error+""; 
        }
        
    }

    // Function to create HMAC-SHA512 Signature
    async createSignatureTxn(secretKey: string, stringToSign: string): Promise<string> {
        const secretKeyHash = crypto.createHash('sha512').update(secretKey).digest('base64');
        const signature = crypto.createHmac('sha512', secretKeyHash).update(stringToSign).digest('hex');
        return signature;
    }

    // Function to handle URL signing
    async generateSignature(fullURL: string, method: string, token: string, reqBody: string): Promise<string> {
        let stringToSign = '';
        let signature = '';
        const timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');
        if (fullURL.includes('access-token')) {
            stringToSign = `${this.clientKey}|${timestamp}`;
            signature = await this.createSignature(this.privateKey, stringToSign);
        } else {
            const minifiedBody = JSON.stringify(JSON.parse(reqBody || '{}'));
            const hashedBody = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase();
            stringToSign = `${method}:${fullURL}:${token}:${hashedBody}:${timestamp}`;
            signature = await this.createSignatureTxn(this.secretKey, stringToSign);
        }

        return signature;
    }
}

export default SignatureService;