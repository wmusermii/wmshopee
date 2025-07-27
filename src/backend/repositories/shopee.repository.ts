import db from '../database/client';
import { logInfo } from '../utils/logger';

export class ShopeeRepository {
  async saveQShopee(payload:any, userInfo:any) {
    // Pastikan fromdate diformat jadi YYYY-MM-DD
    const formattedDate = new Date(payload.fromdate).toISOString().substring(0, 10); // hasilnya "2025-07-24"

    logInfo("Data datepick : ",formattedDate)
    const query = await db('q_shopee').insert(
        {
          fromtime: payload.fromtime,
          totime: payload.totime,
          created_by: userInfo.iduser,
          created_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
          datepick: formattedDate
        }
      ).returning('id');

    return await query;
  }
  async selectQShopeeAll() {
    const today = new Date().toISOString().substring(0, 10);
    const result = await db.select([
      'qs.id',
      'qs.datepick',
      'qs.fromtime',
      'qs.totime',
      'qs.created_by',
      'mu.fullname',
      'qs.created_at'
    ]).from('q_shopee as qs').leftJoin("m_user as mu","qs.created_by","mu.iduser").whereRaw('DATE(qs.created_at) = ?', [today]).orderBy("qs.created_at","desc");
    return result;

    // return await query;
  }
  //################# SHOPEE ATTRB ###############################
  async selectShopeeAPIAtribute(){
    const result = await db.select([
      'ms.id',
      'ms.access_token',
      'ms.refresh_token',
      'ms.shop_id',
      'ms.code',
      'ms.client_id',
      'ms.client_secret',
      'ms.redirect_uri',
      'ms.base_api',
      'ms.update_at',
    ]).from('m_shopee as ms').orderBy("qs.created_at","desc");
    return result;
  }
}
