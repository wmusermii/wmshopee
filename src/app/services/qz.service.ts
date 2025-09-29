import { Injectable } from '@angular/core';
import qz from 'qz-tray';

@Injectable({
  providedIn: 'root'
})
export class QzService {
  private connected = false;

  constructor() {
    this.initQz();
  }

  private initQz() {
  qz.security.setCertificatePromise(() => {
    return Promise.resolve(`-----BEGIN CERTIFICATE-----
TEST
-----END CERTIFICATE-----`);
  });

  qz.security.setSignatureAlgorithm("SHA512"); // optional, tapi biasanya dipakai

qz.security.setSignaturePromise(function(toSign) {
  return function(resolve, reject) {
    // contoh: memanggil API server untuk menandatangani 'toSign'
    // fetch('/api/sign?request=' + toSign)
    //  .then(response => response.ok ? response.text() : Promise.reject(response.text()))
    //  .then(resolve)
    //  .catch(reject);
    // untuk testing, langsung resolve kosong agar tidak error
    resolve('');
  };
});

}


  async connect(): Promise<void> {
  if (!this.connected) {
    try {
      await qz.websocket.connect();
      this.connected = true;
      console.log("QZ Tray connected successfully");
    } catch (error) {
      this.connected = false;
      console.error("Failed to connect to QZ Tray", error);
      throw error; // lempar error agar caller tahu koneksi gagal
    }
  }
}

  async disconnect(): Promise<void> {
    if (this.connected) {
      await qz.websocket.disconnect();
      this.connected = false;
    }
  }

  async getPrinters(): Promise<string[]> {
    const printers = await qz.printers.find();
    return Array.isArray(printers) ? printers : [printers];
  }

  async getDefaultPrinter(): Promise<string> {
    return await qz.printers.getDefault();
  }

  async printPDF(printer: string, pdfUrl: string): Promise<void> {
  if (!this.connected) {
    await this.connect();
  }

  const config = qz.configs.create(printer);

  const data = [{
    type: 'pdf',
    flavor: 'file',
    data: pdfUrl
  }];
  // await qz.print(config, data);
}

}
