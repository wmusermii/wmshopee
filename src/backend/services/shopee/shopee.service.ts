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
    await this.shopeeRepo.updateShopeeToken({access_token:newToken.access_token, refresh_token:newToken.refresh_token, update_at:new Date().toISOString()});

    // console.log('✅ Shopee token refreshed:', result);
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

    if (result.error === 'error_auth') {
      // Refresh token and retry once
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

  public async getOrderList(timeFrom: number, timeTo: number): Promise<any> {
    const path = '/api/v2/order/get_order_list';
    return this.fetchWithAuth(path, {
      time_from: String(timeFrom),
      time_to: String(timeTo),
      page_size: '50',
      response_optional_fields: 'order_status,shipping_carrier' // tambahkan field sesuai kebutuhan
    });
  }

  public async getOrderDetail(orderSnList: string[]): Promise<any> {
    const path = '/api/v2/order/get_order_detail';
    return this.fetchWithAuth(path, {
      order_sn_list: orderSnList.join(','),
      response_optional_fields: 'buyer_user_id,total_amount,region,buyer_username,order_status' // tambahkan sesuai kebutuhan
    });
  }
}
