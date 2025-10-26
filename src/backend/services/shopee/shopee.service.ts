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
    console.log("Time from : ", timeFrom);
    console.log("Time End : ", timeTo);
    const timestamp_from = Math.floor(await this.toTimestampWIB(timeFrom) / 1000); // e.g. 01:00 WIB
    const timestamp_to = Math.floor(await this.toTimestampWIB(timeTo) / 1000);     // e.g. 04:00 WIB
    console.log(`############################# ${datepick}, ${timestamp_from}, ${timestamp_to}`);
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
      console.log("result : ", result);
      const orders = result?.response?.order_list || [];

      if (orders.length > 0) {
        allOrders.push(...orders);
      }
      hasMore = result?.response?.more === true;
      cursor = result?.response?.next_cursor || '';
    }
    console.log('✅ Total Orders Fetched:', allOrders.length);
    // ⛔ Hanya ambil yang bukan advance fulfilment (tidak punya booking_sn)
    const filteredOrders = allOrders.filter(order => !order.booking_sn);
    console.log('✅ Total Orders After Filter (no booking_sn):', filteredOrders.length);
    return filteredOrders;
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
  public async getPackageDetailList(packagesList: string[]): Promise<any[]> {
    const path = '/api/v2/order/get_package_detail';
    const chunks = this.chunkArray(packagesList, 50); // atau pakai lodash.chunk
    const allDetails: any[] = [];
    for (const chunk of chunks) {
      // console.log("############ CHUNK ", chunk);
      const res = await this.fetchWithAuth(path, {
        package_number_list: chunk
      });
      // console.log("Get Package Detail ", res);
      if (res && res.response && res.response.package_list) {
        allDetails.push(...res.response.package_list);
      }
    }
    return allDetails;

  }
  // public async getShipmentList(datepick: string, timeFrom: string, timeTo: string): Promise<any[]> {
  //   const path = '/api/v2/order/get_shipment_list';
  //   // const timestamp_from = await this.toTimestampWIB(datepick, timeFrom); // e.g. 01:00 WIB
  //   // const timestamp_to = await this.toTimestampWIB(datepick, timeTo);     // e.g. 04:00 WIB
  //   // console.log(`############################# ${datepick}, ${timeFrom}, ${timeTo}`);
  //   let cursor = '';
  //   let hasMore = true;
  //   const allOrders: any[] = [];
  //   while (hasMore) {
  //     const params: Record<string, any> = {
  //       page_size: '100'
  //     };
  //     if (cursor) {
  //       params['cursor'] = cursor;
  //     }
  //     const result = await this.fetchWithAuth(path, params);
  //     const orders = result?.response?.order_list || [];
  //     if (orders.length > 0) {
  //       allOrders.push(...orders);
  //     }
  //     hasMore = result?.response?.more === true;
  //     cursor = result?.response?.next_cursor || '';
  //   }
  //   console.log('✅ Total Shipment Fetched:', allOrders.length);
  //   return allOrders;
  // }
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

  public async getChannelList(): Promise<any> {
    const path = '/api/v2/logistics/get_channel_list';
    const res = await this.fetchWithAuth(path, {});
    // console.log("RETURN DARI PARAMETER : ",res);
    if (res && res.response) {
      return res.response
    }
    return { status: "error", message: "Error Channel List" }
  }

 public async getShippingParameterMass(orders: any[]): Promise<any> {
  const batchSize = 50;
  const allSuccess: any[] = [];
  const allFail: any[] = [];
  const alldropoff: any[] = [];
  let pickupAddressList: any[] = [];

  const shippingParamList = await this.getChannelList();
  const listLogisticts: any[] = shippingParamList.logistics_channel_list;

  // 🧩 Step 1: Group orders berdasarkan logistics_channel_id atau shipping_carrier
  const groupedOrders: Record<string, any[]> = {};
  for (const order of orders) {
    // Coba cocokkan carrier dengan channel ID dari daftar Shopee
    const matchedChannel = listLogisticts.find(l =>
      order.shipping_carrier?.toLowerCase().includes(l.logistics_channel_name.toLowerCase())
    );

    const channelId = matchedChannel ? matchedChannel.logistics_channel_id : "unknown";

    if (!groupedOrders[channelId]) groupedOrders[channelId] = [];
    groupedOrders[channelId].push(order);
  }

  // 🧩 Step 2: Loop setiap grup berdasarkan logistics_channel_id
  for (const [channelId, group] of Object.entries(groupedOrders)) {
    console.log(`🚚 Processing logistics_channel_id: ${channelId} with ${group.length} orders`);

    // Bagi grup ini per 50 order
    for (let i = 0; i < group.length; i += batchSize) {
      const batch = group.slice(i, i + batchSize);
      const package_list = batch.map(o => ({ package_number: o.package_number }));

      const path = '/api/v2/logistics/get_mass_shipping_parameter';
      try {
        const res = await this.fetchWithAuthMETHOD(path, {}, "POST", { package_list });
        console.log("RESPONSE SHIPPING 1 ",res);
        console.log("RESPONSE SHIPPING 2  ",res.response.info_needed.pickup);
        if (res && res.response) {
          const response = res.response;

          // Simpan pickup address (kalau belum disimpan)
          if (!pickupAddressList.length && response.pickup?.address_list) {
            pickupAddressList = response.pickup.address_list;
          }

          if (response.success_list?.length) {
            allSuccess.push(...response.success_list);
          }
          if (response.fail_list?.length) {
            allFail.push(...response.fail_list);
          }
          if (response.dropoff?.branch_list) {
            alldropoff.push(...response.dropoff.branch_list);
          }
        } else {
          console.error("Invalid response:", res);
        }
      } catch (error) {
        console.error(`Error on batch for channel ${channelId}:`, error);
      }
    }
  }

  return {
    pickupAddressList,
    success_list: allSuccess,
    fail_list: allFail,
    drop_off: alldropoff
  };
}




  public async getDocumentReadyParameterMass(order: any[]): Promise<any> {
    const cleanData = order.map(({ tracking_number, ...rest }) => rest);
    let arrayData = await this.addShippingType(cleanData);
    // console.log("DOCUMNT TO CHECK READY : ", arrayData);
    const path = '/api/v2/logistics/get_shipping_document_result';
    const res = await this.fetchWithAuthMETHOD(path, {}, "POST", {
      order_list: arrayData
    });
    // console.log("RETURN Ready getDocumentReadyParameterMass : ",res);
    if (res && res.response) {
      return res.response
    }
    return { res }
  }



  public async getMassShippingParameter(orders: any[]): Promise<any> {
    // const resultShipParam: any[] = [];
    // const resultNoShipParam: any[] = [];
    const shipingParam = await this.getShippingParameterMass(orders);
    // console.log("hasil getMassShippingParameter : ", shipingParam);
    const objResult = { pickup_address: shipingParam.pickupAddressList, shipping_Param: shipingParam.success_list, noshipping_Param: shipingParam.fail_list, dropoff_param: shipingParam.drop_off }
    return objResult;
  }
  public async getMassDocumentReadyParameter(orders: any[]): Promise<any> {
    // const resultShipParam: any[] = [];
    // const resultNoShipParam: any[] = [];
    const shipingReady = await this.getDocumentReadyParameterMass(orders);
    console.log("service getDocumentReadyParameterMass ", shipingReady);
    if (shipingReady.result_list) {
      const objResult = { orders, documentready: shipingReady.result_list }
      return objResult;
    }
    const objResult = { orders, error: shipingReady.res.error, message: shipingReady.res.message, documentready: [] }
    return objResult;
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
  public async postShipOrderMASS(packagenumbers: any, addressObj: any, timeSlot: any): Promise<any> {
    console.log("*** postShipOrderMASS packages : ", packagenumbers);
    console.log("*** postShipOrderMASS addressObj : ", addressObj.address_id);
    console.log("*** postShipOrderMASS timeSlot : ", timeSlot.pickup_time_id);
    const path = '/api/v2/logistics/mass_ship_order';
    const res = await this.fetchWithAuthMETHOD(path, {}, "POST", {
      package_list: packagenumbers,
      pickup: {
        address_id: addressObj.address_id,
        pickup_time_id: timeSlot.pickup_time_id
      }
    });
    // console.log("** RETURN DARI SHOP ORDER : ", res);
    if (res) {
      return res
    }
    const shipParameter = null;
    return shipParameter;
  }
  // dropOffObj,branchObj
  public async postShipOrderMASSCounter(packagenumbers: any, dropOffObj: any): Promise<any> {
    console.log("*** postShipOrderMASSCounter packages : ", packagenumbers);
    console.log("*** postShipOrderMASSCounter dropOffObj : ", dropOffObj);
    console.log("*** postShipOrderMASSCounter timeslotObj : ", dropOffObj.pickup_time_id);
    const path = '/api/v2/logistics/mass_ship_order';
    const res = await this.fetchWithAuthMETHOD(path, {}, "POST", {
      package_list: packagenumbers,
      pickup: {
        address_id: dropOffObj.address_id,
        pickup_time_id: dropOffObj.pickup_time_id
      }
    });
    console.log("** RETURN DARI SHOP ORDER : ", res);
    if (res) {
      return res
    }
    const shipParameter = null;
    return shipParameter;
  }


  public async postMassShipOrder(orders: any, addressObj: any, timeSlot: any): Promise<any> {
    const resultShipOrder: any[] = [];
    const resultNoShipOrder: any[] = [];
    const packageList = await this.ArraytoPackagesNumberOnly(orders);
    const shipingOrders: any = await this.postShipOrderMASS(packageList, addressObj, timeSlot);
    if (shipingOrders.error) {
      const result = { shipped_orders: resultShipOrder, noshipped_orders: resultNoShipOrder, error: shipingOrders.error, message: shipingOrders.message }
      return result;
    } else {
      // console.log("Hasil Post Order ",shipingOrders);
      const successShippingOrders: any[] = shipingOrders.response.success_list;
      const failShippingOrders: any[] = shipingOrders.response.fail_list;
      // console.log("Retirn dari shipping order success ",successShippingOrders);
      // console.log("Retirn dari shipping order failed ",failShippingOrders);
      const result = { shipped_orders: successShippingOrders, noshipped_orders: failShippingOrders }
      return result;
    }
  }

  public async postMassShipOrderCounter(orders: any, dropOffObj: any): Promise<any> {
    const resultShipOrder: any[] = [];
    const resultNoShipOrder: any[] = [];
    const packageList = await this.ArraytoPackagesNumberOnly(orders);
    // const shipingParam = await this.getShippingParameterMass(orders);
    // console.log("GET SHIPPING PARAM PADA postMassShipOrderCounter ",shipingParam);



    const shipingOrders: any = await this.postShipOrderMASSCounter(packageList, dropOffObj);

    if (shipingOrders.error) {
      const result = { shipped_orders: resultShipOrder, noshipped_orders: resultNoShipOrder, error: shipingOrders.error, message: shipingOrders.message }
      return result;
    } else {
      // console.log("Hasil Post Order ",shipingOrders);
      const successShippingOrders: any[] = shipingOrders.response.success_list;
      const failShippingOrders: any[] = shipingOrders.response.fail_list;
      // console.log("Retirn dari shipping order success ",successShippingOrders);
      // console.log("Retirn dari shipping order failed ",failShippingOrders);
      const result = { shipped_orders: successShippingOrders, noshipped_orders: failShippingOrders }
      return result;
    }
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

  async checkAndStraightLabelNew(orders: any[], addressObj: any, timeSlot: any): Promise<any> {
    try {
      let returnDownload: any = {};
      let realOrders = orders;
      let attempt = 0;
      // ⏺️ kumpulan info gagal (agar dikirim di return akhir)
      const failedSummary: any[] = [];
      while (true) {
        attempt++;
        console.log(`🔄 Percobaan ke-${attempt}, total orders:`, realOrders.length);
        const documentResultInfo = await this.getMasshippingDocumentInfo(realOrders);
        console.log("RETURN CHECK DOCUMENT : ", documentResultInfo);

        if (documentResultInfo.error) {
          console.log("document error message : ", documentResultInfo.message);

          // Jika document belum siap karena belum order ship
          if (documentResultInfo.message?.includes("The package should print first")) {
            console.log("⚠️ Harus order ship dulu");

            // 🚀 Lakukan mass ship
            const massshipordersResult = await this.postMassShipOrder(realOrders, addressObj, timeSlot);
            console.log("Return dari create mass order ", massshipordersResult);

            if (massshipordersResult.error) {
              return ApiResponse.successNoData(massshipordersResult, massshipordersResult.error);
            }

            // ⚠️ Jika ada order yang gagal ship
            if (massshipordersResult.noshipped_orders?.length > 0) {
              const failOrders = massshipordersResult.noshipped_orders;
              const failReasons = failOrders.map((o: any) => ({
                order_sn: o.order_sn,
                package_number: o.package_number,
                reason: o.fail_reason || "Unknown reason",
              }));

              failedSummary.push(...failReasons);

              const packageDeleted = await this.tostringArrayPackagesOnly(failOrders);
              await this.shopeeRepo.updQShopeeInvoiceShippingType(packageDeleted);

              console.warn("❌ Beberapa order gagal ship:", failReasons.length, "=>", failReasons);

              // Hapus order gagal dari proses selanjutnya
              realOrders = realOrders.filter(
                order => !failOrders.some((fail: any) => fail.package_number === order.package_number)
              );
            }

            // ✅ Lanjut hanya dengan order sukses
            const shippedOrders: any[] = massshipordersResult.shipped_orders || [];
            if (shippedOrders.length === 0) {
              console.warn("⚠️ Tidak ada order yang berhasil ship, hentikan loop.");
              return ApiResponse.success(
                { failedOrders: failedSummary },
                "No shipped orders found"
              );
            }
            // Ambil tracking number
            const packageOnlyList = await this.tostringArrayPackagesOnly(shippedOrders);
            await this.delay(500);
            const trackingOrder = await this.getMasTrackingNumberMulti(packageOnlyList);
            console.log("🧾 HASIL TRACKING : ", trackingOrder);

            if (trackingOrder.tracked_orders?.length > 0) {
              const trackedArray = trackingOrder.tracked_orders;
              const mergedToCreateDocs = realOrders.map(order => {
                const found = trackedArray.find((t: any) => t.package_number === order.package_number);
                return found
                  ? {
                    ...order,
                    tracking_number: found.tracking_number,
                    shipping_document_type: 'THERMAL_AIR_WAYBILL',
                  }
                  : order;
              });

              console.log("PAYLOAD CREATE DOCUMENT ", mergedToCreateDocs);
              const createDocuments = await this.createMassShippingDocumentInfoMulti(mergedToCreateDocs);
              console.log("🧾 HASIL CREATE DOCUMENT :", createDocuments);

              realOrders = mergedToCreateDocs;
              await this.delay(500);
              continue;
            }
          }
        }
        // ✅ Jika document sudah READY
        else {
          const resultDocumentInfo = documentResultInfo.response?.result_list || [];
          console.log("Hasil create document pickup ", resultDocumentInfo);

          if (resultDocumentInfo.length > 0) {
            const uploadFolder = resolve(__dirname, '../upload');
            const filteredOrders = realOrders.filter(order =>
              resultDocumentInfo.some((doc: any) => doc.order_sn === order.order_sn)
            );
            console.log("ORDER YANG BISA CETAK ", filteredOrders);
            await this.delay(100);
            const massDownloadRESULT = await this.downloadMassShippingStraighInfo(filteredOrders, uploadFolder);
            if (massDownloadRESULT) {
              return ApiResponse.success(
                {
                  downloadResult: massDownloadRESULT,
                  failedOrders: failedSummary, // ✅ kirim juga order gagal ship
                },
                "Download success (some orders may have failed)"
              );
            }
          }
        }

        return ApiResponse.successNoData(
          { failedOrders: failedSummary },
          "No tracked orders found"
        );
      }
    } catch (error) {
      console.error("❌ ERROR (checkAndStraightLabelNew):", error);
      return ApiResponse.badRequest(error, "Error data");
    }
  }
  // dropOffObj,branchObj
  async checkAndStraightLabelCounter(orders: any[], dropOffObj: any): Promise<any> {
    try {
      // let returnDownload: any = {};
      let realOrders = orders;
      let attempt = 0;
      // ⏺️ kumpulan info gagal (agar dikirim di return akhir)
      const failedSummary: any[] = [];
      while (true) {
        attempt++;
        console.log(`🔄 Percobaan ke-${attempt}, total orders:`, realOrders.length);
        const documentResultInfo = await this.getMasshippingDocumentInfo(realOrders);
        console.log("*****  RETURN CHECK DOCUMENT : ", documentResultInfo);
        if (documentResultInfo.error) {
          console.log("document error message : ", documentResultInfo.message);
          // Jika document belum siap karena belum order ship
          if (documentResultInfo.message?.includes("The package should print first")) {
            console.log("⚠️ Harus order ship dulu");
            // 🚀 Lakukan mass ship
            const massshipordersResult = await this.postMassShipOrderCounter(realOrders, dropOffObj);
            console.log("Return dari create mass counter order ", massshipordersResult);
            if (massshipordersResult.error) {
              return ApiResponse.successNoData(massshipordersResult, massshipordersResult.error);
            }
            // ⚠️ Jika ada order yang gagal ship
            if (massshipordersResult.noshipped_orders?.length > 0) {
              const failOrders = massshipordersResult.noshipped_orders;

              const failReasons = failOrders.map((o: any) => {
                // Cari matching order di realOrders untuk ambil order_sn jika tidak ada
                const foundOrder = realOrders.find(
                  (r: any) => r.package_number === o.package_number
                );
                return {
                  order_sn: o.order_sn || foundOrder?.order_sn || "UNKNOWN_ORDER_SN",
                  package_number: o.package_number,
                  reason: o.fail_reason || "Unknown reason",
                };
              });

              failedSummary.push(...failReasons);
              console.warn("❌ Beberapa order gagal ship:", failReasons.length, "=>", failReasons);

              // Hapus order gagal dari proses selanjutnya
              realOrders = realOrders.filter(
                order => !failOrders.some((fail: any) => fail.package_number === order.package_number)
              );
            }

            // ✅ Lanjut hanya dengan order sukses
            const shippedOrders: any[] = massshipordersResult.shipped_orders || [];
            if (shippedOrders.length === 0) {
              console.warn("⚠️ Tidak ada order yang berhasil ship, hentikan loop.");
              return ApiResponse.success(
                { failedOrders: failedSummary },
                "No shipped orders found"
              );
            }
            // Ambil tracking number
            const packageOnlyList = await this.tostringArrayPackagesOnly(shippedOrders);
            await this.delay(100);
            const trackingOrder = await this.getMasTrackingNumberMulti(packageOnlyList);
            console.log("🧾 Tracking Result Counter : ", trackingOrder);

            if (trackingOrder.tracked_orders?.length > 0) {
              const trackedArray = trackingOrder.tracked_orders;
              const mergedToCreateDocs = realOrders.map(order => {
                const found = trackedArray.find((t: any) => t.package_number === order.package_number);
                return found
                  ? {
                    ...order,
                    tracking_number: found.tracking_number,
                    shipping_document_type: 'THERMAL_AIR_WAYBILL',
                  }
                  : order;
              });

              console.log("PAYLOAD CREATE DOCUMENT ", mergedToCreateDocs);
              const createDocuments = await this.createMassShippingDocumentInfoMulti(mergedToCreateDocs);
              console.log("🧾 HASIL CREATE DOCUMENT :", createDocuments);

              realOrders = mergedToCreateDocs;
              await this.delay(100);
              continue;
            }
          }
        }
        {
          const resultDocumentInfo = documentResultInfo.response?.result_list || [];
          console.log("Hasil getMasshippingDocumentInfo check document counter ", resultDocumentInfo);
          await this.delay(1000);
          if (resultDocumentInfo.length > 0) {
            // 🔹 Pisahkan antara dokumen yang READY dan yang gagal
            const readyDocs = resultDocumentInfo.filter(
              (doc: any) => doc.status === "READY" && !doc.fail_error
            );

            const failedDocs = resultDocumentInfo.filter(
              (doc: any) => doc.fail_error || doc.status !== "READY"
            );

            // 🔸 Masukkan yang gagal ke daftar failedSummary agar bisa direkap
            if (failedDocs.length > 0) {
              const failedMapped = failedDocs.map((doc: any) => ({
                order_sn: doc.order_sn,
                package_number: realOrders.find(o => o.order_sn === doc.order_sn)?.package_number,
                reason: doc.fail_message || doc.fail_error || "Unknown document error",
              }));
              failedSummary.push(...failedMapped);
              console.warn("❌ Beberapa dokumen gagal dibuat: jumlah (", failedMapped.length+" )", failedMapped);
            }

            // 🔹 Lanjutkan proses hanya untuk yang dokumen READY
            if (readyDocs.length > 0) {
              const uploadFolder = resolve(__dirname, "../upload");
              const filteredOrders = realOrders.filter(order =>
                readyDocs.some((doc: any) => doc.order_sn === order.order_sn)
              );

              console.log("**** Order Langsung Cetak Counter ", filteredOrders);
              await this.delay(50);
              const massDownloadRESULT = await this.downloadMassShippingStraighInfo(filteredOrders, uploadFolder);

              if (massDownloadRESULT) {
                return ApiResponse.success(
                  {
                    downloadResult: massDownloadRESULT,
                    failedOrders: failedSummary, // ✅ kirim juga order gagal ship/dokumen
                  },
                  "Download success (some orders may have failed)"
                );
              }
            } else {
              console.warn("⚠️ Tidak ada dokumen READY, semua gagal cetak label.");
              return ApiResponse.success(
                { failedOrders: failedSummary },
                "No document READY for printing"
              );
            }
          }
        }

        return ApiResponse.successNoData(
          { failedOrders: failedSummary },
          "No tracked orders found"
        );
      }
    } catch (error) {
      console.error("❌ ERROR (checkAndStraightLabelNew):", error);
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
    console.log("getTrackingNumberMass Package List ");
    const path = '/api/v2/logistics/get_mass_tracking_number';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', { package_list: packageList });
    // const res = await this.fetchWithAuthMETHOD(path, { order_sn: order_sn });
    // console.log("RESP TRACKING ", res);
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
    const resultMassTrack = await this.getTrackingNumberMass(packagesArray);
    console.log("Hasil resultMassTrack:", resultMassTrack);
    if (resultMassTrack) {
      // Pisahkan berdasarkan apakah tracking_number ada atau kosong
      const validTracks = (resultMassTrack.success_list || []).filter(
        (item: any) => item.tracking_number && item.tracking_number.trim() !== ""
      );
      const emptyTracks = (resultMassTrack.success_list || []).filter(
        (item: any) => !item.tracking_number || item.tracking_number.trim() === ""
      );
      resultTrack = validTracks;
      resultNoTrack = [
        ...(resultMassTrack.fail_list || []),
        ...emptyTracks // tambahkan tracking kosong ke notracked_orders
      ];
    }
    return {
      tracked_orders: resultTrack,
      notracked_orders: resultNoTrack
    };
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
    console.log("hasil create document ", resultCreateArray);
    // Ambil hanya data yang tidak punya fail_error
    resultCreated = await resultCreateArray.response.result_list.filter((item: { fail_error: any; }) => !item.fail_error);
    resultError = await resultCreateArray.response.result_list.filter((item: { fail_error: any; }) => item.fail_error);
    const result: any = { created_orders: resultCreated, error_orders: resultError };
    return result;
  }






  async createShippingDocumentInfoBULK(orders: any[]) {
    // console.log("createShippingDocumentInfoBULK ", orders);
    let arrayData = { order_list: orders };
    // console.log("ARRAY DATA BULK ", arrayData);
    const path = '/api/v2/logistics/create_shipping_document';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', arrayData);
    return res;
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

    let arrayData = { order_list: await this.keepOrderSnAndAddShipping(orders) };
    // console.log("ARRAY DATA ", arrayData);
    const path = '/api/v2/logistics/get_shipping_document_result';
    const res = await this.fetchWithAuthMETHOD(path, {}, 'POST', arrayData);
    console.log("Balikan get_shipping_document_result (getMasshippingDocumentInfo) : ", res);
    return res;
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
  async downloadMassShippingStraighInfo(orders: any[], uploadFolder: string): Promise<any> {
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    const apiPath = '/api/v2/logistics/download_shipping_document';
    // Buat payload dengan semua order_sn
    // const orderList = orders.map(order_sn => ({ order_sn }));
    const orderList = orders.map(({ order_sn, package_number }) => ({
      order_sn,
      package_number
    }));
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
  // async toTimestampWIB(date: string, time: string): Promise<number> {
  //   const localDateTime = new Date(`${date}T${time}+07:00`); // Menggabungkan sebagai zona WIB
  //   return Math.floor(localDateTime.getTime() / 1000); // Ubah ke detik
  // }

  async toTimestampWIB(dateTimeStr: string): Promise<number> {
    // Contoh input: "08 Okt 2025, 00.00.08"
    const monthMap: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
      Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11
    };

    // Pisahkan tanggal dan waktu
    const [datePart, timePart] = dateTimeStr.split(',').map(s => s.trim());

    const [dayStr, monthStr, yearStr] = datePart.split(' ');
    const [hourStr, minuteStr, secondStr] = timePart.split('.');

    const day = parseInt(dayStr, 10);
    const month = monthMap[monthStr];
    const year = parseInt(yearStr, 10);
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const second = parseInt(secondStr, 10);

    // Buat tanggal dengan offset WIB (UTC+7)
    const dateObj = new Date(Date.UTC(year, month, day, hour, minute, second));

    return dateObj.getTime(); // dalam milisecond
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
  async ArraytoPackagesNumberOnly(payload: any[]): Promise<any[]> {
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
