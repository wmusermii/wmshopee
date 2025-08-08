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
  async saveQShopeeInvoicesDetail(payload:any[]){
    const query = await db('q_shopee_invoices_detail').insert(payload);
    return await query;
  }

  async viewQShopeePosBySN(payload:any){
    const query = await db('q_shopee_invoices_detail')
    .select(
      'item_id',
      'item_name',
      'model_name',
      'image_url'
    )
    .sum({ qty: 'model_quantity_purchased' })
    .where('status', 0)
    .andWhere('id_q_shopee', payload.id)
    .groupBy('item_id')
    .orderBy('qty', 'desc');
    return await query;
  }
  async selectSKUAvailable() {
    const query = await db('m_product')
    .select(
      'item_id',
      'item_sku',
      'item_name',
      'item_condition',
      'item_status',
      'orgBrand',
      'model_id',
      'model_name',
      'filename'
    )
    .orderBy('item_id', 'asc');
    return await query;
  }
  async selectPackagesAvailable() {
    const query = await db('q_shopee_invoices')
    .select(
      'id_q_shopee',
      'create_time',
      'order_status',
      'total_amount',
      'update_time',
      'status',
      'order_sn',
      'ship_by_date'
    )
    .where('status', 0)
    .orderBy('id_q_shopee', 'asc');
    return await query;
  }
  async selectPackageIfTaken(payload:any) {
    const query = await db('q_shopee_invoices')
    .select(
      'id_q_shopee',
      'create_time',
      'order_status',
      'total_amount',
      'update_time',
      'status',
      'order_sn',
      'ship_by_date'
    )
    .where('status','>', 0)
    .andWhere('order_sn', payload.order_sn).first()
    return await query;
  }
  async selectItemsPackagesAvailable(payload:any, userinfo:any) {
    //#######################CHECK APAKAH q_shopee_invoices SUDAH TERUPDATE STATUSNYA######################
    const checkStatus = await db('q_shopee_invoices').select('status').where('order_sn', payload.order_sn).first();
    //######################################################
    if(checkStatus.status === 0) {
      //################################ UPDATE q_shopee_invoices dulu bahwa sudah di take _1
      const updateStatus = await db('q_shopee_invoices').update({
          status: 1,
          updated_by: userinfo.iduser,
          updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
        }).where('order_sn', payload.order_sn).returning('id_q_shopee');
      //#######################################################
      if(updateStatus){
              const query = await db('q_shopee_invoices_detail')
            .select(
              'id_q_shopee',
              'order_sn',
              'item_id',
              'item_name',
              'item_sku',
              'model_id',
              'model_name',
              'model_quantity_purchased as qty',
              'image_url',
              'status',
              'create_time'
            )
            .where('order_sn', payload.order_sn)
            .orderBy('create_time', 'desc');
            return await query;
        } else {
            return [];
        }
      } else {
          const query = await db('q_shopee_invoices_detail')
            .select(
              'id_q_shopee',
              'order_sn',
              'item_id',
              'item_name',
              'item_sku',
              'model_id',
              'model_name',
              'model_quantity_purchased as qty',
              'image_url',
              'status',
              'create_time'
            )
            .where('order_sn', payload.order_sn)
            .orderBy('create_time', 'desc');
            return await query;
      }
  }
   async selectItemsToPrint(payload:any, userinfo:any) {
    //#######################CHECK APAKAH q_shopee_invoices SUDAH TERUPDATE STATUSNYA######################
    const checkStatus = await db('q_shopee_invoices').select('status').where('order_sn', payload.order_sn).first();
    //######################################################
    if(checkStatus.status === 0) {
      //################################ UPDATE q_shopee_invoices dulu bahwa sudah di take _1
      const updateStatus = await db('q_shopee_invoices').update({
          status: 3,
          updated_by: userinfo.iduser,
          updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
        }).where('order_sn', payload.order_sn).returning('id_q_shopee');
      //#######################################################
      if(updateStatus){
            const query = await db('q_shopee_invoices_detail')
            .select(
              'id_q_shopee',
              'order_sn',
              'item_id',
              'item_name',
              'item_sku',
              'model_id',
              'model_name',
              'model_quantity_purchased as qty',
              'image_url',
              'status',
              'create_time'
            )
            .where('order_sn', payload.order_sn)
            .orderBy('create_time', 'desc');
            return await query;
        } else {
            return [];
        }
      } else {
          const query = await db('q_shopee_invoices_detail')
            .select(
              'id_q_shopee',
              'order_sn',
              'item_id',
              'item_name',
              'item_sku',
              'model_id',
              'model_name',
              'model_quantity_purchased as qty',
              'image_url',
              'status',
              'create_time'
            )
            .where('order_sn', payload.order_sn)
            .orderBy('create_time', 'desc');
            return await query;
      }
  }
  async getCountInvoicesAvailable(){
      const  packageAvailable = await this.selectPackagesAvailable();
      const result = {invoiceQty:packageAvailable.length};
      return result;
  }
  async getCountSKUAvailable(){
      const  packageAvailable = await this.selectSKUAvailable();
      const result = {skuQty:packageAvailable.length};
      return result;
  }
  async updateItemsPackagesAvailable(payload:any, userInfo:any) {

    const query = await db('q_shopee_invoices_detail').update(
        {
          status: 1,
          updated_by: userInfo.userid,
          updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
        }
      ).where("id_q_shopee", payload.id_q_shopee).andWhere("order_sn",payload.order_sn).andWhere("item_id",payload.item_id).returning('id_q_shopee');
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
    ]).from('q_shopee as qs').leftJoin("m_user as mu","qs.created_by","mu.iduser").whereRaw('DATE(qs.created_at) = ?', [today]).orderBy("qs.created_at","desc");
    return result;
    // .andWhere('qs.status', 0)
    // return await query;
  }
  async getSMTPVariables(){
      const query = await db('m_smtp')
      .select(
        'smtp',
        'usermail',
        'password',
        'service',
        'secret',
        'refreshtoken',
        'accesstoken',
        'port'
      ).first();
      return await query;
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
