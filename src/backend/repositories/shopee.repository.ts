import db from '../database/client';
import { logInfo } from '../utils/logger';

export class ShopeeRepository {
  async saveQShopee(payload:any, userInfo:any) {
    const query = await db('q_shopee').insert(
        {
          fromtime: payload.fromtime,
          totime: payload.totime,
          created_by: userInfo.iduser,
          created_at: db.fn.now(),
          datepick: payload.fromdate
        }
      ).returning('id');
    return await query;
  }
}
