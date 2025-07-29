import db from '../database/client';
import { logInfo } from '../utils/logger';

export class ShopeeRepository {
  async saveQShopee(payload:any, userInfo:any) {
    // Pastikan fromdate diformat jadi YYYY-MM-DD
    const formattedDate = new Date(payload.fromdate).toISOString().substring(0, 10); // hasilnya "2025-07-24"
    const query = await db('q_shopee').insert(
        {
          fromtime: payload.fromtime,
          totime: payload.totime,
          created_by: userInfo.iduser,
          created_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
          datepick: formattedDate,
          totalresi:payload.totalresi,
          listresi:payload.listresi
        }
      ).returning('id');

    return await query;
  }
  async updateQShopee(payload:any) {
    const query = await db('q_shopee').update(
        {
          status: 1
        }
      ).where("id", payload.id).returning('id');

    return await query;
  }
  async saveQShopeeInvoices(payload:any[]) {
   const query = await db('q_shopee_invoices').insert(payload);
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
      'qs.status',
      'qs.totalresi',
      'qs.created_at'
    ]).from('q_shopee as qs').leftJoin("m_user as mu","qs.created_by","mu.iduser").whereRaw('DATE(qs.created_at) = ?', [today]).andWhere('qs.status', 0).orderBy("qs.created_at","desc");
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
    ]).from('m_shopee as ms').first();
    return result;
  }
  async selectShopeeJobsByID(payload:any){
    const result = await db.select([
      'qs.id',
      'qs.listresi'
    ]).from('q_shopee as qs').where("id",payload.id).first();
    return result;
  }
  async updateShopeeToken(payload:any) {
    logInfo("Update data token : ");
    const query = await db('m_shopee').update(
        {
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          update_at:payload.update_at
        }
      ).where("id",'1000001').returning('id');

    return await query;
  }
}
