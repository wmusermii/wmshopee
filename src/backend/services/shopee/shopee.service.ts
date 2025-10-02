import crypto from 'crypto';
import { ShopeeRepository } from '../../repositories/shopee.repository';
import { logInfo } from '../../utils/logger';
import { ApiResponse } from '../../utils/apiResponse';
import fs from 'fs';
import path, { join, resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
// import { result } from 'lodash';
import os from "os";
// Dapatkan path file saat ini dari import.meta.url
const __filename = fileURLToPath(import.meta.url);

// Dapatkan direktori dari __filename
const __dirname = path.dirname(__filename);
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
      logInfo('✅ Shopee refresh on fetchWithAuth Error:', result)
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

    // console.log("RESPONS DOWNLOAD ",res);


    console.log("fetchWithAuthMETHOD Content-Type:", contentType);
    let resultYMP;
    if (contentType.includes("application/json")) {
      resultYMP = await res.json();
    } else {
      // resultYMP = await res.text(); // plain text fallback
      resultYMP = res.body;
    }
    const result = resultYMP;
    if (result.error === 'invalid_acceess_token') {
      // Refresh token and retry once
      logInfo('✅ Shopee refresh on fetchWithAuthMETHOD Error:', result)
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
      // console.log("Get Order Detail ", res);
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
  public async getShippingParameter(order: any): Promise<any> {
    const path = '/api/v2/logistics/get_shipping_parameter';
    const res = await this.fetchWithAuth(path, {
      order_sn: order.order_sn
    });
    // console.log("RETURN DARI PARAMETER : ",res);
    if (res && res.response) {
      return res.response
    }
    return { status: "error", message: "Error Shipping parameter" }
  }

  public async getShippingParameterMass(order: any[]): Promise<any> {
    const packages_numbers = await this.ArraytoPackagesNumberOnly(order);

    const path = '/api/v2/logistics/get_mass_shipping_parameter';
    const res = await this.fetchWithAuthMETHOD(path, {}, "POST", {
      package_list: packages_numbers
    });
    // console.log("RETURN DARI PARAMETER MASS getShippingParameterMass : ",res);
    if (res && res.response) {
      return res.response
    }
    return { status: "error", message: "Error Shipping parameter" }
  }
  public async getMassShippingParameter(orders: any[]): Promise<any> {
    const resultShipParam: any[] = [];
    const resultNoShipParam: any[] = [];
    const shipingParam = await this.getShippingParameterMass(orders);
    console.log("hasil getMassShippingParameter : ", shipingParam);
    if (shipingParam && shipingParam.success_list.length > 0) {
      const address_id = shipingParam.pickup.address_list[0].address_id;
      const pickup_times = shipingParam.pickup.address_list[0].time_slot_list[0];
      const shipParam = { orders, address_id: address_id, pickup_time: pickup_times };
      resultShipParam.push(shipParam);
    } else {
      const shipParam = { orders,fail_list:shipingParam.fail_list,address_id: null, pickup_time: null };
      resultNoShipParam.push(shipParam);
    }
    //###################################################
    const result = { shipping_Param: resultShipParam, noshipping_Param: resultNoShipParam }
    return result;
  }



  // public async getMassShippingParameter(orders: any[]): Promise<any> {
  //   const resultShipParam: any[] = [];
  //   const resultNoShipParam: any[] = [];
  //   for (const order of orders) {
  //     const shipingParam = await this.getShippingParameter(order);
      // if (shipingParam) {
      //   const address_id = shipingParam.pickup.address_list[0].address_id;
      //   const pickup_times = shipingParam.pickup.address_list[0].time_slot_list[0];
      //   const shipParam = { order, address_id: address_id, pickup_time: pickup_times };
      //   resultShipParam.push(shipParam);
      // } else {
      //   const shipParam = { order, address_id: null, pickup_time: null };
      //   resultNoShipParam.push(shipParam);
      // }
  //   }
  //   //###################################################
  //   const result = { shipping_Param: resultShipParam, noshipping_Param: resultNoShipParam }
  //   return result;
  // }





  public async getShipOrder(order: any, addressObj: any): Promise<any> {
    const path = '/api/v2/logistics/ship_order';
    const res = await this.fetchWithAuthMETHOD(path, {}, "POST", {
      order_sn: order.order_sn,
      pickup: {
        address_id: addressObj.address_id,
        pickup_time_id: addressObj.pickup_time.pickup_time_id
      }
    });
    console.log("RETURN DARI SHOP ORDER : ", res);
    if (res) {
      return res
    }
    const shipParameter = null;
    return shipParameter;
  }
  public async getShipOrderMASS(packagenumbers: any, addressObj: any): Promise<any> {

    const path = '/api/v2/logistics/mass_ship_order';
    const res = await this.fetchWithAuthMETHOD(path, {}, "POST", {
      package_list: packagenumbers,
      pickup: {
        address_id: addressObj.address_id,
        pickup_time_id: addressObj.pickup_time.pickup_time_id
      }
    });
    console.log("RETURN DARI SHOP ORDER : ", res);
    if (res) {
      return res
    }
    const shipParameter = null;
    return shipParameter;
  }



  public async getMassShipOrder(shipingparam: any): Promise<any> {
    const resultShipOrder: any[] = [];
    const resultNoShipOrder: any[] = [];
    console.log("GET MASSSHIPORDER ", shipingparam);

    if(shipingparam.shipping_Param.length < 1) return { shipped_orders: [], noshipped_orders: shipingparam.noshipping_Param };

    const shipingOrders = await this.getShipOrderMASS(shipingparam.shipping_Param[0].orders,{address_id:shipingparam.shipping_Param[0].address_id,pickup_time: shipingparam.shipping_Param[0].pickup_time});
    console.log("RETURN getMassShipOrder : ", shipingOrders);
    if(shipingOrders) {
      const result = { shipped_orders: shipingOrders.response.success_list, noshipped_orders: shipingOrders.response.fail_list }
      return result;
    } else {
      const result = { shipped_orders: resultShipOrder, noshipped_orders: resultNoShipOrder }
      return result;
    }


    // for (const order of addressObj) {
    //   const shipingParam = await this.getShipOrder(order.order, order);
    //   // logInfo("Ketika ship order 1 ", shipingParam);
    //   if (shipingParam) {
    //     if (shipingParam.error === '') {
    //       logInfo("Ketika ship order 2 ");
    //       const objectShipOrder = { request_id: shipingParam.request_id, order_sn: order.order.order_sn }
    //       resultShipOrder.push(objectShipOrder);
    //     } else {
    //       logInfo("Ketika ship order 3 ", shipingParam.error);
    //       const objectNoShipOrder = { request_id: shipingParam.request_id, order_sn: order.order.order_sn }
    //       resultNoShipOrder.push(objectNoShipOrder);
    //     }
    //   } else {
    //     logInfo("Ketika ship order 4 ", "shipingParam kosong");
    //     const objectNoShipOrder = { request_id: shipingParam.request_id, order_sn: order.order.order_sn }
    //     resultNoShipOrder.push(objectNoShipOrder);
    //   }
    // }
    //###################################################
    // const result = { shipped_orders: resultShipOrder, noshipped_orders: resultNoShipOrder }
    // const result = { shipped_orders: resultShipOrder, noshipped_orders: resultNoShipOrder }
    // return result;
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

    // Ambil tipe dokumen yang tersedia (contoh: "THERMAL_AIR_WAYBILL")
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
      let orderObj1: any = orders[11];
      let orderObj2: any = orders[12];
      let orderObj3: any = orders[13];
      let orderObj4: any = orders[14];
      let orderObj5: any = orders[15];
      let orderObj6: any = orders[16];
      let orderObj7: any = orders[17];
      let orderObj8: any = orders[18];
      let orderObj9: any = orders[19];
      let orderObj10: any = orders[20];
      let shippingParameter: any = {};
      let orderList: string[] = [];
      orderList.push(orderObj1.order_sn); orderList.push(orderObj2.order_sn); orderList.push(orderObj3.order_sn);
      orderList.push(orderObj4.order_sn); orderList.push(orderObj5.order_sn); orderList.push(orderObj6.order_sn);
      orderList.push(orderObj7.order_sn); orderList.push(orderObj8.order_sn); orderList.push(orderObj9.order_sn);
      orderList.push(orderObj10.order_sn);
      // 1. Cek detail order untuk dapatkan status terbaru
      let orderDetail: any = await this.getOrderDetail(orderList);
      // console.log("Hasil Cek Order DETAIL STATUS : ", orderDetail);
      // console.log("Kode Order : ", orderDetail);
      orderDetail = orderDetail.filter((order: { order_status: string; }) => order.order_status === 'PROCESSED');
      if (!orderDetail) throw new Error('Order tidak ditemukan');
      if (orderDetail[0].order_status === 'READY_TO_SHIP' || orderDetail[0].order_status === 'PROCESSED') {
        shippingParameter = await this.getShippingParameter(orderDetail[0]);
        const trackingInfo: any[] = await this.getMasTrackingNumber(orderList);
        // console.log("HASIL TRACKING ", trackingInfo);
        const createDocuments: any = await this.createMassShippingDocumentInfo(trackingInfo);
        console.log("HASIL CREATE DOC ", createDocuments);
        const hasilCreateDocArray: any[] = createDocuments.result_list;
        // Buat Set order_sn yang ada fail_error di failOrderSnSet
        const failOrderSnSet = new Set(hasilCreateDocArray.filter(item => item.fail_error).map(item => item.order_sn));
        // console.log("HASIL failOrderSnSet FILTER ", failOrderSnSet);
        // Filter array1 hanya yang order_sn-nya tidak ada di failOrderSnSet
        const filteredArray1 = trackingInfo.filter(item => !failOrderSnSet.has(item.order_sn));
        //  console.log("HASIL FILTER ", filteredArray1);
        const docInfo = await this.getMasshippingDocumentInfo(filteredArray1);
        console.log("HASIL DOC MASS TRACKING : ", docInfo.result_list);
        const ordersToPrint = await this.tostringArrayOnly(docInfo.result_list);
        console.log("ORDER YANG DI PRINT : ", ordersToPrint);
        await this.delay(1000); // tunggu selama 10 detik (10000 ms)
        const uploadFolder = resolve(__dirname, '../upload');
        // const massDownloadRESULT = await this.downloadShippingDocumentInfo(ordersToPrint, uploadFolder)
        // console.log(" Printing Orders : ", massDownloadRESULT);
        //########################################################################################################################
        // const stream = await this.downloadShippingDocumentInfo(orderDetail[0].order_sn);
        // const uploadFolder = resolve(__dirname, '../upload');
        // const pathBaru = resolve(uploadFolder, `label_${orderDetail[0].order_sn}.pdf`);
        // console.log("PATHBARU ", pathBaru);
        // // const pathNew = `/upload/label_${orderDetail[0].order_sn}.pdf`;
        // await this.streamToFile(stream, pathBaru);
        // console.log('File PDF berhasil disimpan!');
        //########################################################################################################################
      }
      if (orderDetail[0].order_status === 'SHIPPED') {
        return;
      }
      return { status: 'pending', message: `Order belum siap dikirim, status saat ini: ${orderDetail}` };
    } catch (error) {
      console.log("NGAPA", error);
      return ApiResponse.badRequest(error, "Error data");
    }
  }
  // async checkAndDownloadLabelNew(orders: any[]): Promise<any> {
  //   try {
  //     let returnDownload: any = {};
  //     console.log("Raw Orders to Print : ", orders.length);
  //     let orderOnlyList = await this.tostringArrayOnly(orders);
  //     // 1. Check manakah yang sudah ada tracking ordernya
  //     const trackingInfo: any = await this.getMasTrackingNumberMulti(orderOnlyList);
  //     console.log("Hasil Tracking ==> ", trackingInfo);
  //     // 2. Ambil yang sudah ada tracking ordernya saja
  //     if (trackingInfo.tracked_order.length > 0) {
  //       orderOnlyList = await this.tostringArrayOnly(trackingInfo.tracked_order);
  //       console.log("String Array Order to create Doc : ", orderOnlyList.length);
  //       //3. Create Document yang sudah ada track nya
  //       const createDocuments: any = await this.createMassShippingDocumentInfoMulti(trackingInfo.tracked_order);
  //       console.log("Result created doc : ", createDocuments.created_orders.length);
  //       console.log("Result No created doc : ", createDocuments.error_orders.length); //INI BIASANYA KARENA SUDAH SHIPPED
  //       await this.delay(500); // tunggu selama 10 detik (10000 ms)
  //       if (createDocuments.created_orders.length < 1) {
  //         return { code: 'crd001', message: 'download label success', data: createDocuments }; return
  //       }
  //       const uploadFolder = resolve(__dirname, '../upload');
  //       const ordersToPrint = await this.tostringArrayOnly(createDocuments.created_orders);
  //       console.log("String Array Order to download doc 1 : ", ordersToPrint.length);
  //       const massDownloadRESULT = await this.downloadMassShippingDocumentInfo(ordersToPrint, uploadFolder)
  //       // console.log(" Download results : ", massDownloadRESULT);
  //       if (massDownloadRESULT) return ApiResponse.success(massDownloadRESULT, "Download success");
  //       return ApiResponse.successNoData(massDownloadRESULT, "No download success");
  //     } else {
  //       console.log("No tracking orders  : ", trackingInfo.notracked_order.length);
  //       returnDownload = { code: "001", message: "Tracking orders found!", data: trackingInfo }
  //       console.log("=== Try create shipping order ===");
  //       const shippingParameter = await this.getMassShippingParameter(trackingInfo.notracked_order);
  //       // console.log("SHIP PARAM ############################## ", shippingParameter);
  //       const orderShip = await this.getMassShipOrder(shippingParameter.shipping_Param)
  //       console.log("Order ships result ######### : ", orderShip);
  //       await this.delay(1000);
  //       if (orderShip.shipped_orders.length > 0) orderOnlyList = await this.tostringArrayOnly(orderShip.shipped_orders);
  //       const trackingInfo2: any = await this.getMasTrackingNumberMulti(orderOnlyList);
  //       console.log("HASIL MASS TRACKING 2 ", trackingInfo2);
  //       if (trackingInfo2.tracked_order.length > 0) {
  //         //3. Create Document yang sudah ada track nya
  //         const createDocuments2: any = await this.createMassShippingDocumentInfoMulti(trackingInfo2.tracked_order);
  //         console.log("Result created doc 2 : ", createDocuments2.created_orders.length);
  //         console.log("Result No created doc 2 : ", createDocuments2.error_orders.length); //INI BIASANYA KARENA SUDAH SHIPPED
  //         await this.delay(500); // tunggu selama 10 detik (10000 ms)
  //         if (createDocuments2.created_orders.length < 1) {
  //           return { code: 'crd001', message: 'download label success', data: createDocuments2 }; return
  //         }
  //         const uploadFolder2 = resolve(__dirname, '../upload');
  //         const ordersToPrint2 = await this.tostringArrayOnly(createDocuments2.created_orders);
  //         console.log("String Array Order to download doc 2 : ", ordersToPrint2.length);
  //         await this.delay(1500);
  //         const massDownloadRESULT2 = await this.downloadMassShippingDocumentInfo(ordersToPrint2, uploadFolder2)
  //         // console.log(" Download results : ", massDownloadRESULT);
  //         if (massDownloadRESULT2) return ApiResponse.success(massDownloadRESULT2, "Download success");
  //         return ApiResponse.successNoData(massDownloadRESULT2, "No download success");
  //       }
  //     }
  //     return returnDownload;
  //   } catch (error) {
  //     console.log("NGAPA (603) : ", error);
  //     return ApiResponse.badRequest(error, "Error data");
  //   }
  // }

  // async checkAndStraightLabelNew(orders: any[]): Promise<any> {
  //   try {
  //     let returnDownload: any = {};
  //     const realOrders = orders
  //     console.log("Raw Orders to Print : ", realOrders);
  //     let packageOnlyList = await this.tostringArrayPackagesOnly(orders);
  //     // console.log("HASIL PACKAGE NUMBER ONLY ", packageOnlyList);
  //     // 1. Check manakah yang sudah ada tracking ordernya
  //     const trackingInfo: any = await this.getMasTrackingNumberMulti(packageOnlyList);
  //     console.log("HASIL MASS TRACKING ", trackingInfo);
  //     if (trackingInfo.tracked_orders.length > 0) {
  //       console.log("Membuat documentnya ");
  //       const realOrdersTracked = realOrders.map(item => {
  //         const found = trackingInfo.tracked_orders.find(
  //           (d: { package_number: any }) => d.package_number === item.package_number
  //         );
  //         return found ? { ...item, ...found } : item;
  //       });
  //       // 2. Create Document yang sudah ada track nya
  //       const createDocuments = await this.createMassShippingDocumentInfoMulti(realOrdersTracked);
  //       // ##################### JIKA BELUM ORDER SHIP
  //       // if(createDocuments.error_orders.length === realOrdersTracked.length) return ApiResponse.successNoData({}, "The package can not print now.  Detail: The document is not yet ready for printing. Please try again later.");
  //       if(createDocuments.error_orders.length > 0) {
  //         const realOrdersNoOrderShip = realOrders.map(item => {
  //         const found = createDocuments.error_orders.find(
  //             (d: { package_number: any }) => d.package_number === item.package_number
  //           );
  //           return found ? { ...item, ...found } : item;
  //         });
  //         console.log("PAYLOAD CREATE ORDER (738)", "realOrdersNoOrderShip");
  //         const shippingParameter = await this.getMassShippingParameter(realOrdersNoOrderShip);
  //         console.log("HASIL SHIPPING PARAMETER", shippingParameter);
  //          console.log("MEMBUAT SHIP ORDER (741)");
  //         const orderShips = await this.getMassShipOrder(shippingParameter)
  //         console.log("HASIL SHIP ORDER (774) : ",orderShips);
  //         // {
  //         //   shipped_orders: [
  //         //     { package_number: 'OFG213055604225984' },
  //         //     { package_number: 'OFG213059340265650' },
  //         //     { package_number: 'OFG213063348263795' },
  //         //     { package_number: 'OFG213064173264151' }
  //         //   ],
  //         //   noshipped_orders: []
  //         // }
  //         return ApiResponse.successNoData({}, "The package can not print now.  Detail: The document is not yet ready for printing. Please try again later.");
  //       }
  //       const ordersToPrint = await this.tostringArrayOnly(createDocuments.created_orders);
  //       const uploadFolder = resolve(__dirname, '../upload');
  //       await this.delay(1500);
  //       const massDownloadRESULT = await this.downloadMassShippingStraighInfo(ordersToPrint, uploadFolder)
  //       console.log(" Download massDownloadRESULT results : ", massDownloadRESULT);
  //       if (massDownloadRESULT) return ApiResponse.success(massDownloadRESULT,"Download success");
  //     } else if(trackingInfo.notracked_orders.length > 0){
  //       console.log("Membuat ship order");
  //       const realOrdersNoTracked = realOrders.map(item => {
  //         const found = trackingInfo.notracked_orders.find(
  //           (d: { package_number: any }) => d.package_number === item.package_number
  //         );
  //         return found ? { ...item, ...found } : item;
  //       });
  //       console.log("Membuat Ordership nya cari shipping parameternya ");
  //       const shippingParameter = await this.getMassShippingParameter(trackingInfo.notracked_order);
  //       console.log("SHIP PARAM ############################## ", shippingParameter);


  //     } else {
  //       return ApiResponse.successNoData({}, "No download success");
  //     }


  //   } catch (error) {
  //     console.log("NGAPA (497) : ", error);
  //     return ApiResponse.badRequest(error, "Error data");
  //   }
  // }

  async checkAndStraightLabelNew(orders: any[]): Promise<any> {
  try {
    let returnDownload: any = {};
    const realOrders = orders;

    while (true) {
      console.log("Raw Orders to Print : ", realOrders);

      let packageOnlyList = await this.tostringArrayPackagesOnly(orders);
      const trackingInfo: any = await this.getMasTrackingNumberMulti(packageOnlyList);
      console.log("HASIL MASS TRACKING ", trackingInfo);

      if (trackingInfo.tracked_orders.length > 0) {
        const realOrdersTracked = realOrders.map(item => {
          const found = trackingInfo.tracked_orders.find(
            (d: { package_number: any }) => d.package_number === item.package_number
          );
          return found ? { ...item, ...found } : item;
        });

        const createDocuments = await this.createMassShippingDocumentInfoMulti(realOrdersTracked);
        console.log("CREATE MULTI DOCUMENT :",createDocuments);
        if (createDocuments.error_orders.length > 0) {
          console.log("### realOrdersNoOrderShip ### ",realOrders);
          console.log("### Error Orders ### ",createDocuments.error_orders);
          const realOrdersNoOrderShip = realOrders
            .filter(item =>
              createDocuments.error_orders.some((d: { package_number: any; }) => d.package_number === item.package_number)
            )
            .map(item => {
              const found = createDocuments.error_orders.find((d: { package_number: any; }) => d.package_number === item.package_number);
              return { ...item, ...found };
            });
          console.log("CARI SHIPPING YANG ERROR PAYLOAD : ",realOrdersNoOrderShip);

          let shippingParameter = await this.getMassShippingParameter(realOrdersNoOrderShip);
          console.log("HASIL SHIPPING PARAM SERVICE 1 : ",shippingParameter);
          if(shippingParameter.noshipping_Param.length > 0) {
            const realOrdersOrderShip = realOrders
            .filter(item =>
              createDocuments.created_orders.some((d: { package_number: any; }) => d.package_number === item.package_number)
            )
            .map(item => {
              const found = createDocuments.created_orders.find((d: { package_number: any; }) => d.package_number === item.package_number);
              return { ...item, ...found };
            });
            // console.log("PAYLOAD 2 : ",realOrdersOrderShip);
            console.log("CARI SHIPPING YANG VALID PAYLOAD : ",realOrdersOrderShip);
            if(realOrdersOrderShip.length > 0) {
               shippingParameter = await this.getMassShippingParameter(realOrdersOrderShip);
            console.log("HASIL SHIPPING PARAM SERVICE 2 : ",shippingParameter);
            }


            // return ApiResponse.successNoData(shippingParameter.noshipping_Param, shippingParameter.noshipping_Param[0].fail_list);
          }

          const orderShips = await this.getMassShipOrder(shippingParameter);
          console.log("HASIL SHIP ORDER (767) : ", orderShips);
          console.log("HASIL SHIP ORDER (777) : ", orderShips.noshipped_orders.length > 0? orderShips.noshipped_orders[0].fail_list : "No Failed");
          // kalau ada shipped_orders, ulangi dari awal loop
          if (orderShips.shipped_orders?.length > 0) {
            console.log("Ulangi proses karena ada shipped_orders...");
            continue; // <-- balik ke "Raw Orders to Print"
          }

          return ApiResponse.successNoData({}, "The package can not print now...");
        }

        const ordersToPrint = await this.tostringArrayOnly(createDocuments.created_orders);
        const uploadFolder = resolve(__dirname, '../upload');
        await this.delay(1500);
        const massDownloadRESULT = await this.downloadMassShippingStraighInfo(ordersToPrint, uploadFolder);

        if (massDownloadRESULT) {
          return ApiResponse.success(massDownloadRESULT, "Download success");
        }

      } else if (trackingInfo.notracked_orders.length > 0) {
        const realOrdersNoTracked = realOrders.map(item => {
          const found = trackingInfo.notracked_orders.find(
            (d: { package_number: any }) => d.package_number === item.package_number
          );
          return found ? { ...item, ...found } : item;
        });

        const shippingParameter = await this.getMassShippingParameter(trackingInfo.notracked_order);
        console.log("SHIP PARAM ############################## ", shippingParameter);

      } else {
        return ApiResponse.successNoData({}, "No download success");
      }

      break; // kalau tidak ada alasan untuk ulang, keluar loop
    }

  } catch (error) {
    console.log("NGAPA (497) : ", error);
    return ApiResponse.badRequest(error, "Error data");
  }
}




  async getTrackingNumber(order_sn: string) {
    const path = '/api/v2/logistics/get_tracking_number';
    const res = await this.fetchWithAuth(path, { order_sn: order_sn });
    //console.log("RESP TRACKING ", res);
    return res.response;
  }
  async getTrackingNumberMass(packageList: any) {
    console.log("Package List ");
    const path = '/api/v2/logistics/get_mass_tracking_number';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', { package_list: packageList });
    // const res = await this.fetchWithAuthMETHOD(path, { order_sn: order_sn });
    console.log("RESP TRACKING ", res);
    return res.response;
  }

  async getMasTrackingNumber(orders: any[]): Promise<any[]> {
    const result: any[] = [];
    for (const order of orders) {
      const objectTracking = await this.getTrackingNumber(order);
      if (objectTracking) {
        result.push({
          tracking_number: objectTracking.tracking_number,
          order_sn: order // atau order.order_sn kalau orders isinya object
        });
      }
    }
    return result;
  }
  async getMasTrackingNumberMulti(packages: any[]): Promise<any> {
    let resultTrack: any[] = [];
    let resultNoTrack: any[] = [];
    const packagesArray = packages.map(item => ({ package_number: item }));
    // console.log("object at getMasTrackingNumberMulti Service ", packagesArray);
    const resultMassTrack = await this.getTrackingNumberMass(packagesArray);
    // console.log("Hasil resultMassTrack : ",resultMassTrack);
    if (resultMassTrack) {
      resultTrack = resultMassTrack.success_list;
      resultNoTrack = resultMassTrack.fail_list;
      const result = { tracked_orders: resultTrack, notracked_orders: resultNoTrack }
      return result;
    } else {
      const result = { tracked_orders: resultTrack, notracked_orders: resultNoTrack }
      return result;
    }
    // for (const order of orders) {
    //   const objectTracking = await this.getTrackingNumber(order);
    //   if (objectTracking) {
    //     if (objectTracking.tracking_number !== '') {
    //       resultTrack.push({
    //         tracking_number: objectTracking.tracking_number,
    //         order_sn: order // atau order.order_sn kalau orders isinya object
    //       });
    //     } else {
    //       resultNoTrack.push({
    //         tracking_number: objectTracking.tracking_number,
    //         order_sn: order // atau order.order_sn kalau orders isinya object
    //       });
    //     }
    //   }
    // }
    //###################################################
    // const result = { tracked_order: resultTrack, notracked_order: resultNoTrack }
    // return result;
  }
  // async getMasTrackingNumberMulti(orders: any[]): Promise<any> {
  //   const resultTrack: any[] = [];
  //   const resultNoTrack: any[] = [];
  //   // console.log("object at getMasTrackingNumberMulti Service ", orders);
  //   for (const order of orders) {
  //     const objectTracking = await this.getTrackingNumber(order);
  //     if (objectTracking) {
  //       if (objectTracking.tracking_number !== '') {
  //         resultTrack.push({
  //           tracking_number: objectTracking.tracking_number,
  //           order_sn: order // atau order.order_sn kalau orders isinya object
  //         });
  //       } else {
  //         resultNoTrack.push({
  //           tracking_number: objectTracking.tracking_number,
  //           order_sn: order // atau order.order_sn kalau orders isinya object
  //         });
  //       }
  //     }
  //   }
  //   //###################################################
  //   const result = { tracked_order: resultTrack, notracked_order: resultNoTrack }
  //   return result;
  // }
  async createMassShippingDocumentInfo(orders: any[]): Promise<any[]> {
    let result: any[] = [];
    result = await this.createShippingDocumentInfoBULK(orders);
    return result;
  }

  async createMassShippingDocumentInfoMulti(orders: any[]): Promise<any> {
    let resultCreated: any[] = [];
    let resultError: any[] = [];
    // console.log("createMassShippingDocumentInfoMulti ", orders);
    const resultCreateArray = await this.createShippingDocumentInfoBULK(orders);
    // Ambil hanya data yang tidak punya fail_error
    resultCreated = await resultCreateArray.result_list.filter((item: { fail_error: any; }) => !item.fail_error);
    resultError = await resultCreateArray.result_list.filter((item: { fail_error: any; }) => item.fail_error);
    const result: any = { created_orders: resultCreated, error_orders: resultError };
    return result;
  }






  async createShippingDocumentInfoBULK(orders: any[]) {
    // console.log("createShippingDocumentInfoBULK ", orders);
    let arrayData = { order_list: await this.addShippingType(orders) };
    // console.log("ARRAY DATA BULK ", arrayData);
    const path = '/api/v2/logistics/create_shipping_document';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', arrayData);
    return res.response;
  }
  async createShippingDocumentInfo(order_sn: string, tracking_number: string) {
    const path = '/api/v2/logistics/create_shipping_document';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', {
      order_list: [{
        order_sn: order_sn,
        tracking_number: tracking_number,
        shipping_document_type: "THERMAL_AIR_WAYBILL"
      }],
    });
    return res.response;
  }
  async getMasshippingDocumentInfo(orders: any[]) {
    // console.log("getMasshippingDocumentInfo ",orders);
    let arrayData = { order_list: await this.keepOrderSnAndAddShipping(orders) };
    // console.log("ARRAY DATA ", arrayData);
    const path = '/api/v2/logistics/get_shipping_document_result';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', arrayData);
    // console.log("Balikan Mass ",res);
    return res.response;
  }
  async getShippingDocumentInfo(order_sn: string, tracking_number: string) {
    const path = '/api/v2/logistics/get_shipping_document_result';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', {
      order_list: [{
        order_sn: order_sn,
        shipping_document_type: "THERMAL_AIR_WAYBILL"
      }],

    });
    return res.response;
  }
  async downloadShippingDocumentInfo(order_sn: string) {
    const path = '/api/v2/logistics/download_shipping_document';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', {
      shipping_document_type: "THERMAL_AIR_WAYBILL",
      order_list: [{
        order_sn: order_sn
      }],
    });
    return res;
  }
  async downloadMassShippingDocumentInfo(orders: string[], uploadFolder: string): Promise<any> {
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    const savedFiles: string[] = [];
    for (const order_sn of orders) {
      let orderSNArray: any[] = [order_sn]
      const checkOrderDetail = await this.getOrderDetail(orderSNArray);
      // console.log("Check Order Detail Dahulu ", checkOrderDetail);
      const apiPath = '/api/v2/logistics/download_shipping_document';
      // Panggil API untuk tiap order_sn
      const stream = await this.fetchWithAuthMETHOD(apiPath, {}, 'POST', {
        shipping_document_type: "THERMAL_AIR_WAYBILL",
        order_list: [{
          order_sn: order_sn
        }],
      });
      const filePath = resolve(uploadFolder, `label_${order_sn}.pdf`);
      await this.streamToFile(stream, filePath);
      savedFiles.push(filePath);
    }
    // return savedFiles; // kembalikan array path file hasil simpanan
    // Gabungkan file-file PDF tadi jadi satu file pdf gabungan
    const timestamp = Date.now(); // milisecond sekarang
    const fileName: string = `${timestamp}_labels.pdf`;
    const combinedFilePath = resolve(uploadFolder, fileName);
    await this.mergePdfFiles(savedFiles, combinedFilePath);
    // let resultCombine:any[]=[];
    // resultCombine.push(combinedFilePath);
    let result = { fileName: fileName, orders: orders }
    return result; // kembalikan path file gabungan
  }
  async downloadMassShippingStraighInfo(orders: string[], uploadFolder: string): Promise<any> {
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    const apiPath = '/api/v2/logistics/download_shipping_document';
    // Buat payload dengan semua order_sn
    const orderList = orders.map(order_sn => ({ order_sn }));
    // console.log("PAYLOAF ORDER LIST DOWNLOAD FILE ", orderList);
    // Fetch satu kali ke Shopee
    const stream = await this.fetchWithAuthMETHOD(apiPath, {}, 'POST', {
      shipping_document_type: "THERMAL_AIR_WAYBILL",
      order_list: orderList,
    });
    const timestamp = Date.now();
    const fileName: string = `${timestamp}_labels.pdf`;
    const filePath = resolve(uploadFolder, fileName);
    // deteksi IP otomatis
    const ip = await this.getLocalIP();
    const port = 4000; // sesuaikan dengan port Express Anda
    const fileUrl = `http://${ip}:${port}/upload/${fileName}`;
    // Simpan hasil PDF
    await this.streamToFile(stream, filePath);
    let result = { fileName, fileUrl, orders };
    return result;
  }

  async mergePdfFiles(sourceFiles: string[], outputFile: string): Promise<void> {
    const mergedPdf = await PDFDocument.create();
    for (const filePath of sourceFiles) {
      const pdfBytes = fs.readFileSync(filePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputFile, mergedPdfBytes);
  }

  async exportToCSV(data: any[]): Promise<any> {
    const header = Object.keys(data[0]).join(','); // header csv
    const rows = data.map(obj => Object.values(obj).join(','));
    const csvContent = [header, ...rows].join('\n');
    // const outputFile = path.join(__dirname, 'opname.csv');
    const uploadFolder = resolve(__dirname, '../upload');
    const timestamp = Date.now(); // milisecond sekarang
    const fileName: string = `${timestamp}_opname.csv`;
    const combinedFilePath = resolve(uploadFolder, fileName);
    fs.writeFileSync(combinedFilePath, csvContent, 'utf8');
    console.log(`CSV file created at: ${combinedFilePath}`);
    return fileName;
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
  async addShippingType(data: any[]): Promise<any[]> {
    for (const item of data) {
      // misal ini operasi async, kita simulasikan delay
      await new Promise(resolve => setTimeout(resolve, 10));
      delete item.pickup_code;
      delete item.hint;
      item.shipping_document_type = "THERMAL_AIR_WAYBILL";
    }
    return data;
  }
  async keepOrderSnAndAddShipping(data: any[]): Promise<any[]> {
    const result: any[] = [];
    for (const item of data) {
      await new Promise(resolve => setTimeout(resolve, 50)); // contoh delay kalau perlu
      result.push({
        order_sn: item.order_sn
      });
    }
    return result;
  }
  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async tostringArrayOnly(data: any[]): Promise<string[]> {
    const result: string[] = [];
    for (const item of data) {
      await new Promise(resolve => setTimeout(resolve, 50)); // contoh delay kalau perlu
      result.push(item.order_sn);
    }
    return result;
  }

  async tostringArrayPackagesOnly(data: any[]): Promise<string[]> {
    const result: string[] = [];
    for (const item of data) {
      await new Promise(resolve => setTimeout(resolve, 50)); // contoh delay kalau perlu
      result.push(item.package_number);
    }
    return result;
  }

  async ArraytoPackagesNumberOnly(payload:any[]):Promise<any[]> {
  const arr = payload
  // map synchronous, tapi kita return langsung
  const packages = arr.map(item => ({ package_number: item.package_number }));
  return packages;
}


  async getLocalIP(): Promise<string> {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
    return "127.0.0.1";
  }
}
