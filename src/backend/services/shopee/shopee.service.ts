import crypto from 'crypto';
import { ShopeeRepository } from '../../repositories/shopee.repository';
import { logInfo } from '../../utils/logger';
import { ApiResponse } from '../../utils/apiResponse';
import fs from 'fs';
import path from 'path';
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
    // console.log("#### URL : ", url);
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (method === 'POST' && bodyData) {
      // console.log("BODY PAYLOAD ", bodyData);
      options.body = JSON.stringify(bodyData);
    }
    const res = await fetch(url, options);

    const contentType = res.headers.get("content-type") || "";

    console.log("fetchWithAuthMETHOD Status:", res.status, res.statusText);
    console.log("fetchWithAuthMETHOD Content-Type:", contentType);

    let resultYMP;
    if (contentType.includes("application/json")) {
      resultYMP = await res.json();
      // console.log("Body:", resultYMP);
    } else {
      // resultYMP = await res.text(); // plain text fallback
      resultYMP = res.body;
      // console.log("Body:", resultYMP);
    }
    // console.log("Body:", resultYMP);
    // const result = await res.json();
    const result = resultYMP;
    // console.log("RESULT : ", result);
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
        order_status: 'READY_TO_SHIP',
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
  public async getShipmentList(datepick: string, timeFrom: string, timeTo: string): Promise<any[]> {
    const path = '/api/v2/order/get_shipment_list';
    // const timestamp_from = await this.toTimestampWIB(datepick, timeFrom); // e.g. 01:00 WIB
    // const timestamp_to = await this.toTimestampWIB(datepick, timeTo);     // e.g. 04:00 WIB
    // console.log(`############################# ${datepick}, ${timeFrom}, ${timeTo}`);
    let cursor = '';
    let hasMore = true;
    const allOrders: any[] = [];
    while (hasMore) {
      const params: Record<string, any> = {
        page_size: '100'
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
    console.log('✅ Total Shipment Fetched:', allOrders.length);
    return allOrders;
  }
  public async getOrderDetail(orderSnList: string[]): Promise<any[]> {
    const path = '/api/v2/order/get_order_detail';
    const chunks = this.chunkArray(orderSnList, 50); // atau pakai lodash.chunk
    const allDetails: any[] = [];
    for (const chunk of chunks) {
      // console.log("############ CHUNK ", chunk);
      const res = await this.fetchWithAuth(path, {
        order_sn_list: chunk,
        response_optional_fields: 'order_status,item_list,total_amount,buyer_username,recipient_address,shipping_carrier,invoice_data' // sesuaikan kebutuhan
      });
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
    if (res && res.response) {

      return res.response.overall_performance
    }
    const allDetails: any | undefined = undefined;
    return allDetails;
  }

  public async getShopInfo(): Promise<any[]> {
    const path = '/api/v2/shop/get_profile';
    // const chunks = this.chunkArray(orderSnList, 50); // atau pakai lodash.chunk
    const res = await this.fetchWithAuth(path);
    if (res && res.response) {
      return res.response
    }
    const allDetails: any | undefined = undefined;
    return allDetails;
  }
  //######################## STEP PRINT LABEL SHOPEE API########################
  public async getShippingParameter(order: any): Promise<any[]> {
    // const path = '/api/v2/logistics/get_shipping_parameter';
    // // const chunks = this.chunkArray(orderSnList, 50); // atau pakai lodash.chunk
    // const res = await this.fetchWithAuth(path,{
    //     order_sn: order.order_sn,
    //     package_number:order.package_number
    //   });
    // console.log("RETURN DARI PARAMETER : ",res);
    // if(res && res.response) {
    //   return res.response
    // }
    const shipParameter = await this.shopeeRepo.getShippingVariables(2);
    return shipParameter;
  }
  public async getShipOrder(order: any, addressObj: any): Promise<any> {
    const path = '/api/v2/logistics/ship_order';
    // const chunks = this.chunkArray(orderSnList, 50); // atau pakai lodash.chunk
    const res = await this.fetchWithAuthMETHOD(path, {}, "POST", {
      order_sn: order.order_sn,
      package_number: order.package_number,
      pickup: { address_id: addressObj.address_id }
    });
    // console.log("RETURN DARI SHOP : ",res);
    if (res) {
      return res
    }
    const shipParameter = null;
    return shipParameter;
  }


  //######################## STEP PRINT LABEL ########################
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
    const bodyData: any = {
      order_sn: orderSn,
      package_number: "",
      pickup: {
        address_id: 0,
        pickup_time_id: "",
        tracking_number: ""
      }
    }
    const arrangeRes = await this.fetchWithAuthMETHOD(arrangePath, {}, "POST", bodyData);
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
  async checkAndDownloadLabel(orders: any[]): Promise<any> {
    try {
      let orderObj: any = orders[0];
      let shippingParameter: any = {};
      let orderList: string[] = [];
      orderList.push(orderObj.order_sn)
      // 1. Cek detail order untuk dapatkan status terbaru
      const orderDetail: any = await this.getOrderDetail(orderList);
      console.log("Hasil Cek Order DETAIL STATUS : ", orderDetail[0].order_status);
      if (!orderDetail) throw new Error('Order tidak ditemukan');
      if (orderDetail[0].order_status === 'READY_TO_SHIP') {
        shippingParameter = await this.getShippingParameter(orderObj);
        // console.log("SHIPPING PARAMETER RTS : ",shippingParameter);
      }

      if (orderDetail[0].order_status === 'SHIPPED') {
        shippingParameter = await this.getShippingParameter(orderObj);
        // TEST CREATE SHOP ORDER ###########################
        const shipOrderREsult = await this.getShipOrder(orderObj, shippingParameter);
        // console.log("SHIPPING ORDER SHIP PRC : ", shipOrderREsult);
        if (shipOrderREsult.error) {
          // const trackingInfo = await this.getTrackingNumber(orderObj.order_sn);
          // console.log("HASIL TRACKING ", trackingInfo);
          // const createdocInfo = await this.createShippingDocumentInfo(orderObj.order_sn, trackingInfo.tracking_number);
          // console.log("#### CRATE DOC TRACKING : ",createdocInfo);
          // const docInfo = await this.getShippingDocumentInfo(orderObj.order_sn, trackingInfo.tracking_number);
          // console.log("#### DOC TRACKING : ",docInfo);
          const stream  = await this.downloadShippingDocumentInfo(orderObj.order_sn);
          console.log("#### download TRACKING : ",stream);
          // Simpan stream ke file PDF
          const path = `/upload/label_${orderObj.order_sn}.pdf`;
          await this.streamToFile(stream, path);
          console.log('File PDF berhasil disimpan!');
          // const fileStream = fs.createWriteStream(path);
          // return new Promise<any>((resolve, reject) => {
          //       stream.pipe(fileStream);
          //       stream.on('error', (error: any) => {
          //         reject(error);
          //       });
          //       fileStream.on('finish', () => {
          //         console.log(`File PDF berhasil disimpan di ${path}`);
          //         resolve(path);
          //       });
          //       fileStream.on('error', (error) => {
          //         reject(error);
          //       });
          // });
        }
      }
      return { status: 'pending', message: `Order belum siap dikirim, status saat ini: ${orderDetail}` };
      // 2. Cek status order, apakah sudah dalam tahap pengiriman
      // if (orderDetail[0].order_status === 'SHIPPING') {
      //   return { status: 'success', orderDetail };
      // } else if (orderDetail[0].order_status === 'SHIPPED' || orderDetail[0].order_status === 'PROCESSED') {
      //   const trackingInfo = await this.getTrackingNumber(orderSn);//{ tracking_number: 'SPXID055010739228', hint: '' }
      //   // console.log("HASIL TRACKING ",trackingInfo);
      //   if(!trackingInfo) return ApiResponse.badRequest(trackingInfo,"Undefined data");
      //   // 3. Cek dokumen shipping
      //    const createdocInfo = await this.createShippingDocumentInfo(orderSn, trackingInfo.tracking_number);
      //   // const availableDocs = docInfo.response?.shipping_document_type || [];
      //    console.log("#### CRATE DOC TRACKING : ",createdocInfo);
      //   const docInfo = await this.getShippingDocumentInfo(orderSn, trackingInfo.tracking_number);
      //   // const availableDocs = docInfo.response?.shipping_document_type || [];
      //    console.log("#### DOC TRACKING : ",docInfo);
      //   return ApiResponse.success(trackingInfo,"success tracking data");
      // } else if(orderDetail[0].order_status === 'READY_TO_SHIP') {
      //   return;
      // } else {
      //   return { status: 'pending', message: `Order belum siap dikirim, status saat ini: ${orderDetail.status}` };
      // }
    } catch (error) {
      return ApiResponse.badRequest(error, "Error data");
    }
  }

  async getTrackingNumber(order_sn: string) {
    const path = '/api/v2/logistics/get_tracking_number';
    const res = await this.fetchWithAuth(path, { order_sn: order_sn });
    return res.response;
  }

  async createShippingDocumentInfo(order_sn: string, tracking_number: string) {
    const path = '/api/v2/logistics/create_shipping_document';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', {
      order_list: [{
        order_sn: order_sn,
        tracking_number: tracking_number,
        shipping_document_type: "NORMAL_AIR_WAYBILL"
      }],

    });

    return res.response;
  }
  async getShippingDocumentInfo(order_sn: string, tracking_number: string) {

    const path = '/api/v2/logistics/get_shipping_document_result';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', {
      order_list: [{
        order_sn: order_sn,
        shipping_document_type: "NORMAL_AIR_WAYBILL"
      }],

    });

    return res.response;
  }
  async downloadShippingDocumentInfo(order_sn: string) {
    const path = '/api/v2/logistics/download_shipping_document';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', {
      shipping_document_type: "NORMAL_AIR_WAYBILL",
      order_list: [{
        order_sn: order_sn
      }],
    });
    // console.log("RESPONSE");
    return res;
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
  async streamToFile(stream: ReadableStream, filePath: string): Promise<void> {
  const reader = stream.getReader();
  const writer = fs.createWriteStream(filePath);

  // Fungsi untuk baca terus data dan tulis ke file
  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read();
    if (done) {
      writer.end();
      return;
    }
    writer.write(Buffer.from(value));
    return pump();
  };

  await pump();

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
}
