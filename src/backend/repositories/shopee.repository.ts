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
          created_at: db.fn.now(),
          datepick: formattedDate
        }
      ).returning('id');

    return await query;
  }
  async selectQShopeeAll() {
    const result = await db.select([
      'qs.id',
      'qs.datepick',
      'qs.fromtime',
      'qs.totime',
      'qs.created_by',
      'mu.fullname',
      'qs.created_at'
    ]).from('q_shopee as qs').leftJoin("m_user as mu","qs.created_by","mu.iduser").orderBy("qs.created_at","desc");
    return result;

    // return await query;
  }
}
