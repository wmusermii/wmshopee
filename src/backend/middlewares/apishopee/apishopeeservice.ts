import { ShopeeRepository } from "../../repositories/shopee.repository";
import { ApiResponse } from "../../utils/apiResponse";
import crypto from 'crypto';
import { logError } from "../../utils/logger";
export class ApiShopeeService {

  private shopeeRepo = new ShopeeRepository();
  async getShopInfo() {
    try {
      const shopeeAttrb = await this.shopeeRepo.selectShopeeAPIAtribute();
      if (shopeeAttrb) return ApiResponse.badRequest([], "Unable get shopee attrbute!");
      const timestamp = this.getTimestamp();
      const path = '/api/v2/shop/get_shop_info';
      const sign = await this.generateSignature(path, timestamp, shopeeAttrb.access_token, shopeeAttrb.shop_id)
      const url = `${shopeeAttrb.base_api}${path}?partner_id=${shopeeAttrb.client_id}&timestamp=${timestamp}&access_token=${shopeeAttrb.access_token}&shop_id=${shopeeAttrb.shop_id}&sign=${sign}`;
      const response = await fetch(url); // native fetch in Node 18+
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('\n📦 Shop Info:\n', data);
      return ApiResponse.success(data, "Shopee shop Info");
    } catch (error) {
      logError("Error getshopInfo >> ",error)
      return ApiResponse.badRequest(error, "Get Info failed!");
    }
  }

  async refreshAccessToken() {
    try {
      const shopeeAttrb = await this.shopeeRepo.selectShopeeAPIAtribute();
      if (shopeeAttrb) return ApiResponse.badRequest([], "Unable get shopee attrbute!");
      const timestamp = await this.getTimestamp();
      const path = '/api/v2/auth/access_token/get';
      const sign = await this.generateSignature(path, timestamp, shopeeAttrb.shop_id);
      const url = `${shopeeAttrb.base_api}${path}?partner_id=${shopeeAttrb.client_id}&timestamp=${timestamp}&sign=${sign}`
      const response = await fetch(url); // native fetch in Node 18+
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('\n📦 Refresh token :\n', data);
      return ApiResponse.success(data, "Shopee refresh token");
    } catch (error) {
      logError("Error getshopInfo >> ",error)
      return ApiResponse.badRequest(error, "Get Info failed!");
    }
  }


  async getTimestamp() {
    return Math.floor(Date.now() / 1000);
  }
  async generateSignature(path: string, timestamp: any, accessToken: string = '', shopId: string = '', clientid: string = '', clientsecret: string = '') {
    // const baseString = `${partner_id}${path}${timestamp}`;
    // const baseString = `${process.env.CLIENT_ID}${path}${timestamp}${accessToken}${shopId}`;
    let baseString = `${clientid}${path}${timestamp}`;
    // Refresh token → tidak ada access_token tapi butuh shop_id
    if (!accessToken && shopId) {
      baseString += shopId;
    }
    // Endpoint biasa → ada access_token dan shop_id
    if (accessToken && shopId) {
      baseString += accessToken + shopId;
    }
    return crypto.createHmac('sha256', clientsecret).update(baseString).digest('hex');
  }
}
