import db from '../../database/client';
import crypto from 'crypto';
import { logInfo } from '../../utils/logger';

const getTimestamp = () => Math.floor(Date.now() / 1000);

function generateSignature(path: string, timestamp: number, accessToken = '', shopId = '', clientId: string, clientSecret: string): string {
  let baseString = `${clientId}${path}${timestamp}`;
  if (accessToken && shopId) baseString += accessToken + shopId;
  else if (shopId) baseString += shopId;

  return crypto.createHmac('sha256', clientSecret).update(baseString).digest('hex');
}

async function refreshTokenIfNeeded(shopId: number) {
  logInfo("######### MENGAMBIL ATTRIBUT SHOPEE ################");
  const data = await db('m_shopee').where({ shop_id: shopId }).first();
  if (!data) throw new Error(`No credentials found for shop_id: ${shopId}`);

  const { access_token, refresh_token, client_id, client_secret, base_api, update_at } = data;
  logInfo("DATANYA : ",data);
  const now = Math.floor(Date.now() / 1000);
  const lastUpdate = Math.floor(new Date(update_at).getTime() / 1000);

  // Shopee token expire_in = 43200 (12 jam), refresh jika < 1 jam tersisa
  if (now < lastUpdate + 43200 - 3600) {
    return data; // masih valid
  }
  const path = '/api/v2/auth/access_token/get';
  const timestamp = getTimestamp();
  const sign = generateSignature(path, timestamp, '', shopId.toString(), client_id, client_secret);

  const url = `${base_api}${path}?partner_id=${client_id}&timestamp=${timestamp}&sign=${sign}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token,
      partner_id: Number(client_id),
      shop_id: Number(shopId)
    })
  });

  logInfo("DATA HASIL REFRESH TOKEN ", res)


  if (!res.ok) throw new Error(`Failed to refresh token: ${res.status}`);

  const body = await res.json();

  await db('m_shopee').where({ shop_id: shopId }).update({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    update_at: new Date().toISOString()
  });

  return {
    ...data,
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    update_at: new Date().toISOString()
  };
}

export async function getOrderListAllFromDb(
  shopId: number,
  datepick: string,
  fromtime: string,
  totime: string
): Promise<any[]> {
  const tokenData = await refreshTokenIfNeeded(shopId);
  const { access_token, client_id, client_secret, base_api } = tokenData;

  const timeFrom = Math.floor(new Date(`${datepick}T${fromtime}`).getTime() / 1000);
  const timeTo   = Math.floor(new Date(`${datepick}T${totime}`).getTime() / 1000);

  const allOrders: any[] = [];
  let hasMore = true;
  let cursor = '';
  const path = '/api/v2/order/get_order_list';

  while (hasMore) {
    const timestamp = getTimestamp();
    const sign = generateSignature(path, timestamp, access_token, shopId.toString(), client_id, client_secret);

    const params = new URLSearchParams({
      partner_id: client_id,
      timestamp: timestamp.toString(),
      access_token,
      shop_id: shopId.toString(),
      sign,
      time_range_field: 'create_time',
      time_from: timeFrom.toString(),
      time_to: timeTo.toString(),
      page_size: '50'
    });

    if (cursor) params.append('cursor', cursor);

    const url = `${base_api}${path}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Shopee get_order_list failed: ${res.status}`);

    const json = await res.json();
    const response = json.response;

    allOrders.push(...(response.order_list || []));
    hasMore = response.more;
    cursor = response.next_cursor || '';
  }

  return allOrders;
}

export async function getOrderDetailFromDb(shopId: number, orderSnList: string[]): Promise<any[]> {
  const tokenData = await refreshTokenIfNeeded(shopId);
  const { access_token, client_id, client_secret, base_api } = tokenData;

  const detailedOrders: any[] = [];
  const path = '/api/v2/order/get_order_detail';

  for (let i = 0; i < orderSnList.length; i += 50) {
    const batch = orderSnList.slice(i, i + 50);
    const timestamp = getTimestamp();
    const sign = generateSignature(path, timestamp, access_token, shopId.toString(), client_id, client_secret);

    const params = new URLSearchParams({
      partner_id: client_id,
      timestamp: timestamp.toString(),
      access_token,
      shop_id: shopId.toString(),
      sign,
      order_sn_list: batch.join(','),
      response_optional_fields: 'buyer_username,recipient_address,item_list,total_amount,order_status',
      request_order_status_pending: 'true'
    });

    const url = `${base_api}${path}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Shopee get_order_detail failed: ${res.status}`);

    const json = await res.json();
    detailedOrders.push(...(json.response?.order_list || []));

    await new Promise((r) => setTimeout(r, 1000)); // delay 1s per batch
  }

  return detailedOrders;
}
