import crypto from 'crypto';
import { ShopeeRepository } from '../../repositories/shopee.repository';
import { logInfo } from '../../utils/logger';

interface ShopeeCredential {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  access_token: string;
  shop_id: string;
  base_api: string;
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

export class ShopeeService {
  private shopeeRepo = new ShopeeRepository();

  private async getCredential(): Promise<ShopeeCredential> {
    const creds = await this.shopeeRepo.selectShopeeAPIAtribute();
    return {
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      access_token: creds.access_token,
      shop_id: creds.shop_id,
      base_api: creds.base_api
    };
  }

  private generateSignature(
    path: string,
    timestamp: number,
    accessToken = '',
    shopId = '',
    client_id: string,
    client_secret: string
  ): string {
    let baseString = `${client_id}${path}${timestamp}`;
    if (!accessToken && shopId) {
      baseString += shopId;
    }
    if (accessToken && shopId) {
      baseString += accessToken + shopId;
    }
    return crypto.createHmac('sha256', client_secret).update(baseString, 'utf8').digest('hex');
  }

  public async refreshToken(): Promise<any> {
    const cred = await this.getCredential();
    const path = '/api/v2/auth/access_token/get';
    const timestamp = getTimestamp();
    const sign = this.generateSignature(path, timestamp, '', '', cred.client_id, cred.client_secret);
    const url = `${cred.base_api}${path}?partner_id=${cred.client_id}&timestamp=${timestamp}&sign=${sign}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: cred.refresh_token,
        partner_id: Number(cred.client_id),
        shop_id: Number(cred.shop_id)
      })
    });
    const result = await res.json();
    if (result.error || result.response?.error) {
      console.error('❌ Shopee token refresh failed', result);
      throw new Error(result.message || result.response?.message);
    }
    const newToken = result;
    console.log('✅ Shopee token refreshed:', result);
    await this.shopeeRepo.updateShopeeToken({ access_token: newToken.access_token, refresh_token: newToken.refresh_token, update_at: await this.getLocalDateTime() });
    return newToken;
  }

  private async fetchWithAuth(path: string, queryParams: any = {}): Promise<any> {
    let cred = await this.getCredential();
    let timestamp = getTimestamp();

    let sign = this.generateSignature(path, timestamp, cred.access_token, cred.shop_id, cred.client_id, cred.client_secret);

    const searchParams = new URLSearchParams({
      partner_id: cred.client_id,
      shop_id: cred.shop_id,
      access_token: cred.access_token,
      timestamp: String(timestamp),
      sign,
      ...queryParams
    });
    const url = `${cred.base_api}${path}?${searchParams.toString()}`;
    const res = await fetch(url);
    const result = await res.json();
    // logInfo('✅✅ fetchWithAuth :', result)
    if (result.error === 'invalid_acceess_token') {
      // Refresh token and retry once
      // logInfo('✅ Shopee get List Error:', result)
      const newToken = await this.refreshToken();
      timestamp = getTimestamp();
      sign = this.generateSignature(path, timestamp, newToken.access_token, cred.shop_id, cred.client_id, cred.client_secret);
      const retryParams = new URLSearchParams({
        partner_id: cred.client_id,
        shop_id: cred.shop_id,
        access_token: newToken.access_token,
        timestamp: String(timestamp),
        sign,
        ...queryParams
      });
      const retryUrl = `${cred.base_api}${path}?${retryParams.toString()}`;
      const retryRes = await fetch(retryUrl);
      return await retryRes.json();
    }
    return result;
  }
  private async fetchWithAuthMETHOD(path: string, queryParams: any = {},
  method: 'GET' | 'POST' = 'GET',
  bodyData?: any): Promise<any> {
    let cred = await this.getCredential();
    let timestamp = getTimestamp();
    let sign = this.generateSignature(path, timestamp, cred.access_token, cred.shop_id, cred.client_id, cred.client_secret);
    const searchParams = new URLSearchParams({
      partner_id: cred.client_id,
      shop_id: cred.shop_id,
      access_token: cred.access_token,
      timestamp: String(timestamp),
      sign,
      ...queryParams
    });

    const url = `${cred.base_api}${path}?${searchParams.toString()}`;
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (method === 'POST' && bodyData) {
      options.body = JSON.stringify(bodyData);
    }
    const res = await fetch(url, options);

    const contentType = res.headers.get("content-type") || "";

    console.log("Status:", res.status, res.statusText);
    console.log("Content-Type:", contentType);

    let resultYMP;
    if (contentType.includes("application/json")) {
      resultYMP = await res.json();
    } else {
      resultYMP = await res.text(); // plain text fallback
    }
    console.log("Body:", resultYMP);



    const result = await res.json();

    if (result.error === 'invalid_acceess_token') {
      // Refresh token and retry once
      // logInfo('✅ Shopee get List Error:', result)
      const newToken = await this.refreshToken();
      timestamp = getTimestamp();
      sign = this.generateSignature(path, timestamp, newToken.access_token, cred.shop_id, cred.client_id, cred.client_secret);
      const retryParams = new URLSearchParams({
        partner_id: cred.client_id,
        shop_id: cred.shop_id,
        access_token: newToken.access_token,
        timestamp: String(timestamp),
        sign,
        ...queryParams
      });
      const retryUrl = `${cred.base_api}${path}?${retryParams.toString()}`;
      const retryRes = await fetch(retryUrl, options);
      return await retryRes.json();
    }
    return result;
  }
  public async getOrderList(datepick: string, timeFrom: string, timeTo: string): Promise<any[]> {
    const path = '/api/v2/order/get_order_list';

    const timestamp_from = await this.toTimestampWIB(datepick, timeFrom); // e.g. 01:00 WIB
    const timestamp_to = await this.toTimestampWIB(datepick, timeTo);     // e.g. 04:00 WIB
    console.log(`############################# ${datepick}, ${timeFrom}, ${timeTo}`);
    let cursor = '';
    let hasMore = true;
    const allOrders: any[] = [];

    while (hasMore) {
      const params: Record<string, any> = {
        time_range_field: 'create_time',
        time_from: timestamp_from,
        time_to: timestamp_to,
        order_status:'READY_TO_SHIP',
        page_size: '100',
        response_optional_fields: 'order_status'
      };
      if (cursor) {
        params['cursor'] = cursor;
      }
      const result = await this.fetchWithAuth(path, params);
      const orders = result?.response?.order_list || [];
      if (orders.length > 0) {
        allOrders.push(...orders);
      }
      hasMore = result?.response?.more === true;
      cursor = result?.response?.next_cursor || '';
    }
    console.log('✅ Total Orders Fetched:', allOrders.length);
    return allOrders;
  }

  public async getOrderDetail(orderSnList: string[]): Promise<any[]> {
    const path = '/api/v2/order/get_order_detail';
    const chunks = this.chunkArray(orderSnList, 50); // atau pakai lodash.chunk
    const allDetails: any[] = [];
    for (const chunk of chunks) {
      const res = await this.fetchWithAuth(path, {
        order_sn_list: chunk,
        response_optional_fields: 'order_status,item_list,total_amount,buyer_username,recipient_address,shipping_carrier,invoice_data' // sesuaikan kebutuhan
      });
      // console.log("#### ORDER DETAIL : ",res.response.order_list);
      if (res && res.response && res.response.order_list) {
        allDetails.push(...res.response.order_list);
      }
    }
    return allDetails;
  }

  public async getPerformance(): Promise<any[]> {
    const path = '/api/v2/account_health/get_shop_performance';
    // const chunks = this.chunkArray(orderSnList, 50); // atau pakai lodash.chunk
    const res = await this.fetchWithAuth(path);
    if(res && res.response) {

      return res.response.overall_performance
    }
    const allDetails: any |undefined = undefined;
    return allDetails;
  }
   public async getShopInfo(): Promise<any[]> {
    const path = '/api/v2/shop/get_profile';
    // const chunks = this.chunkArray(orderSnList, 50); // atau pakai lodash.chunk
    const res = await this.fetchWithAuth(path);
    if(res && res.response) {
      return res.response
    }
    const allDetails: any |undefined = undefined;
    return allDetails;
  }

  async getLocalDateTime(): Promise<string> {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const local = new Date(now.getTime() - offsetMs);
    return local.toISOString().slice(0, 19).replace('T', ' ');
  }

  async getShippingLabel(orderSn: string): Promise<Buffer | null> {
    // 1️⃣ Ambil info dokumen pengiriman
    const infoPath = '/api/v2/logistics/get_shipping_document_info';
    const infoRes = await this.fetchWithAuth(infoPath, {
      order_sn_list: orderSn,
    });

    if (infoRes.error || !infoRes.response?.shipping_document_info) {
      console.error('❌ Tidak ada shipping document info:', infoRes);
      return null;
    }

    // Ambil tipe dokumen yang tersedia (contoh: "NORMAL_AIR_WAYBILL")
    const docType = infoRes.response.shipping_document_info[0]?.available_shipping_document_type?.[0];
    if (!docType) {
      console.error(`❌ Tidak ada dokumen tersedia untuk order_sn ${orderSn}`);
      return null;
    }

    // 2️⃣ Download dokumen
    const downloadPath = '/api/v2/logistics/download_shipping_document';
    const downloadRes = await this.fetchWithAuth(downloadPath, {
      order_sn_list: orderSn,
      shipping_document_type: docType,
    });

    if (downloadRes.error || !downloadRes.response?.file) {
      console.error('❌ Gagal download dokumen:', downloadRes);
      return null;
    }

    // File dikembalikan Shopee dalam bentuk Base64
    const fileBase64 = downloadRes.response.file;
    return Buffer.from(fileBase64, 'base64');
  }

  async getShippingLabelWithArrange(orderSn: string): Promise<Buffer | null> {
  // 1️⃣ Arrange shipment dulu
  console.log("###################### ARRANG SHIP ORDER DULU ", orderSn);
  const arrangePath = '/api/v2/logistics/ship_order';
  const bodyData:any={
    order_sn: orderSn,
    package_number: "",
    pickup: {
      address_id: 0,
      pickup_time_id: "",
      tracking_number: ""
    }
  }
  const arrangeRes = await this.fetchWithAuthMETHOD(arrangePath,{},"POST", bodyData);
  console.log("###################### BALIKAN DARI SHIP ORDER");
  if (arrangeRes.error) {
    console.error(`❌ Gagal arrange shipment:`, arrangeRes);
    return null;
  }

  console.log(`✅ Shipment arranged untuk ${orderSn}`);

  // 2️⃣ Ambil info dokumen
  const infoPath = '/api/v2/logistics/get_shipping_document_info';
  const infoRes = await this.fetchWithAuth(infoPath, {
    order_sn_list: orderSn
  });

  if (infoRes.error || !infoRes.response?.shipping_document_info) {
    console.error(`❌ Tidak ada shipping document info untuk ${orderSn}:`, infoRes);
    return null;
  }

  const docType = infoRes.response.shipping_document_info[0]?.available_shipping_document_type?.[0];
  if (!docType) {
    console.error(`❌ Tidak ada dokumen tersedia untuk order_sn ${orderSn}`);
    return null;
  }

  // 3️⃣ Download dokumen
  const downloadPath = '/api/v2/logistics/download_shipping_document';
  const downloadRes = await this.fetchWithAuth(downloadPath, {
    order_sn_list: orderSn,
    shipping_document_type: docType
  });

  if (downloadRes.error || !downloadRes.response?.file) {
    console.error(`❌ Gagal download dokumen untuk ${orderSn}:`, downloadRes);
    return null;
  }

  const fileBase64 = downloadRes.response.file;
  return Buffer.from(fileBase64, 'base64');
}






  async toTimestampWIB(date: string, time: string): Promise<number> {
    const localDateTime = new Date(`${date}T${time}+07:00`); // Menggabungkan sebagai zona WIB
    return Math.floor(localDateTime.getTime() / 1000); // Ubah ke detik
  }
  chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
