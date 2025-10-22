import db from '../database/client';
import type { Knex } from 'knex';
import { logInfo } from '../utils/logger';

export class ShopeeRepository {
  async saveQShopee(payload: any, userInfo: any) {
    // Pastikan fromdate diformat jadi YYYY-MM-DD
     console.log("PAYLOAD INSERT ",payload);
     console.log("ID Q SHOPEE : ",payload.id_q_shopee);
    payload.fromdate = await this.convertDateFormat(payload.fromdate);
    const formattedDate = new Date(payload.fromdate).toISOString().substring(0, 10); // hasilnya "2025-07-24"
    // console.log("PAYLOAD INSERT ",payload);
    if(payload.id_q_shopee > 0) {

      const deleteInvoices = await db('q_shopee_invoices').delete().where("id_q_shopee", payload.id_q_shopee);


       const query = await db('q_shopee').update(
          {
            fromtime: payload.fromtime,
            totime: payload.totime,
            created_by: userInfo.iduser,
            totalresi: payload.totalresi,
            listresi: payload.listresi,
            created_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
            datepick: formattedDate,
          }
        ).where("id", payload.id_q_shopee).returning('id');
        return await query;
    } else {
       const query = await db('q_shopee').insert(
          {
            fromtime: payload.fromtime,
            totime: payload.totime,
            created_by: userInfo.iduser,
            totalresi: payload.totalresi,
            listresi: payload.listresi,
            created_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
            datepick: formattedDate,
          }
        ).returning('id');
        return await query;
    }

  }

  async updateQShopee(payload: any) {
    const query = await db('q_shopee').update(
      {
        status: 1
      }
    ).where("id", payload.id).returning('id');

    return await query;
  }
  async saveQShopeeInvoices(payload: any[]) {
    const query = await db('q_shopee_invoices').insert(payload);
    return await query;
  }
  async deleteQShopeeInvoices(payload: any[]):Promise<any> {
    const query = await db('q_shopee_invoices').delete().whereIn("order_sn",payload);
    return await query;
  }
  async saveQShopeeInvoicesDetail(payload: any[]) {
    // const query = await db('q_shopee_invoices_detail').insert(payload);
    // return await query;
    const chunkSize = 200; // aman untuk SQLite
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      await db('q_shopee_invoices_detail').insert(chunk);
    }
  }
  async deleteQShopeeInvoicesDetail(payload: any[]):Promise<any> {
    const query = await db('q_shopee_invoices_detail').delete().whereIn("order_sn",payload);
    return await query;
  }



  async getQShopeeItembest(payload: string, model_id: string, shipping_carrier: string) {
    const today = new Date().toISOString().substring(0, 10);
    // console.log("######### TODAY : ", today);
    // select order_sn from q_shopee_invoices_detail WHERE item_id ='23216184410.0' and status = 0 GROUP BY order_sn
    const invoicesOfItem = await db('q_shopee_invoices_detail as qid').select("qi.order_sn").innerJoin('q_shopee_invoices as qi', 'qid.order_sn', 'qi.order_sn').where('qid.status', 0).andWhere('qid.item_id', payload).andWhere('qid.model_id', model_id).andWhere('qi.shipping_carrier', shipping_carrier).whereRaw('DATE(qid.create_time) = ?', [today]).groupBy('qid.order_sn');
    const orderList = invoicesOfItem.map((d: { order_sn: any; }) => d.order_sn);
    await new Promise(resolve => setTimeout(resolve, 100));
    // console.log("HASIL AMBIL data ", orderList);
    const query = await db('q_shopee_invoices_detail as qid')
      .select(
        'qid.id_q_shopee',
        'qid.order_sn',
        'qid.item_id',
        'qid.item_name',
        'qid.model_name',
        'qid.model_quantity_purchased',
        'qid.image_url',
        'qid.status',
        'qi.order_status',
        'qi.total_amount',
        'qi.shipping_carrier',
        'qi.package_number',
        'qi.ship_by_date'
      ).innerJoin("q_shopee_invoices as qi", "qid.order_sn", "qi.order_sn")
      .whereIn('qid.order_sn', orderList);
    return await query;
    // return [];
  }
  async getQShopeeItembestMulti(payload:any) {
    // const today = new Date().toISOString().substring(0, 10);
    // console.log("######### getQShopeeItembestMulti : ", payload);
    const items = payload.itemArray;
    const filters = items.map((item: {
      id_q_shopee: any; item_id: any; model_id: any; shipping_carrier: any;
}) => [
        item.id_q_shopee,
        item.item_id,
        item.model_id,
        item.shipping_carrier
      ]);
      const invoicesOfItem = await db('q_shopee_invoices_detail as qid').select('qi.order_sn', 'qid.item_id', 'qid.model_id', 'qi.shipping_carrier', 'qi.package_number').innerJoin('q_shopee_invoices as qi', 'qid.order_sn', 'qi.order_sn').where('qid.status', 0).whereIn(['qid.id_q_shopee', 'qid.item_id', 'qid.model_id', 'qi.shipping_carrier'],filters)
  .groupBy('qid.id_q_shopee','qi.order_sn', 'qid.item_id', 'qid.model_id', 'qi.shipping_carrier', 'qi.package_number');
      const orderList = invoicesOfItem.map((d: { order_sn: string; package_number: string }) => ({
        order_sn: d.order_sn,
        package_number: d.package_number
      }));
      // console.log("ORDER LIST YANG DI PRINT : ", orderList);

      return orderList;

  }
  async updQShopeeInvoiceShippingType(payload:string[]) {
    //   await db('q_shopee_invoices').update({
    //   warehouse_shipping: 3,
    //   updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '),
    // }).whereIn('package_number', payload);
    //   console.log("ORDER LIST YANG DI UPDATE : ", payload);
    //   return payload;
    await db('q_shopee_invoices').delete().whereIn('package_number', payload);
      console.log("ORDER LIST YANG DI DELETE : ", payload);
      return payload;
  }
  // async copyInvoiceToBulkData(orders: any[]) {
  //   // ambil semua order_sn
  //   const invoices: any[] = await db('q_shopee_invoices')
  //     .select('*')
  //     .whereIn('order_sn', orders);
  //   if (invoices.length === 0) {
  //     console.log('Tidak ada data yang cocok.');
  //     return;
  //   }
  //   // insert ke q_shopee_invoices_bulk
  //   const insertInvoiceBulk_Result = await db('q_shopee_invoices_bulk').insert(invoices).returning('order_sn');
  //   const invoicesDetail = await db('q_shopee_invoices_detail')
  //     .select('*')
  //     .whereIn('order_sn', orders);
  //   if (invoicesDetail.length === 0) {
  //     console.log('Tidak ada data yang cocok.');
  //     return;
  //   }
  //   // logInfo("### BANYAK DETAIL ##### ",invoicesDetail.length );
  //   await db('q_shopee_invoices_detail_bulk').insert(invoicesDetail);
  //   // ####################### Masukan ke t_inventory ########################
  //   await db('q_shopee_invoices_bulk').update({
  //     status: 1,
  //     updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '),
  //   }).whereIn('order_sn', orders);

  //   await db('q_shopee_invoices').delete().whereIn('order_sn', orders);

  //   return { message: "Success update table" }
  // }



  // async viewQShopeePosBySN(payload: any) {
  //   const query = await db('q_shopee_invoices_detail as ')
  //     .select(
  //       'item_id',
  //       'item_name',
  //       'model_id',
  //       'model_name',
  //       'image_url'
  //     )
  //     .sum({ qty: 'model_quantity_purchased' })
  //     .where('status', 0)
  //     .andWhereRaw(`date(create_time) = date('now','localtime')`)
  //     .groupBy('item_id', 'model_id')
  //     .orderBy('qty', 'desc');
  //   return await query;
  //   // .andWhere('id_q_shopee', payload.id)
  // }

  async copyInvoiceToBulkData(orders: string[], labelshopee: string): Promise<any> {
    // ambil semua order_sn
    const invoices: any[] = await db('q_shopee_invoices')
      .select('*')
      .whereIn('order_sn', orders);
    if (invoices.length === 0) {
      console.log('Tidak ada data yang cocok.');
      return;
    }
    // console.log("#### q_shopee_invoices yang di delete ", invoices);

    const invoicesWithLabels = await Promise.all(
      invoices.map(async (invoice) => {
        // simulasi proses async (misal API call dll)
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          ...invoice,
          labelshopee: labelshopee
        };
      })
    );




    // insert ke q_shopee_invoices_bulk
    const insertInvoiceBulk_Result = await db('q_shopee_invoices_bulk').insert(invoicesWithLabels).returning('order_sn');
    const invoicesDetail = await db('q_shopee_invoices_detail')
      .select('*')
      .whereIn('order_sn', orders);
    if (invoicesDetail.length === 0) {
      console.log('Tidak ada data yang cocok.');
      return;
    }
    // logInfo("### BANYAK DETAIL ##### ",invoicesDetail.length );
    await db('q_shopee_invoices_detail_bulk').insert(invoicesDetail);
    // ####################### Masukan ke t_inventory ########################
    await db('q_shopee_invoices_bulk').update({
      status: 1,
      updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '),
    }).whereIn('order_sn', orders);

    await db('q_shopee_invoices').delete().whereIn('order_sn', orders);

    return { message: "Success update table" }
  }




  async viewQShopeePosBySN(payload: any) {
    const query = await db('q_shopee_invoices_detail as qid')
      .select(
        'qid.id_q_shopee',
        'qid.item_id',
        'qid.item_name',
        'qid.model_id',
        'qid.model_name',
        'qid.image_url',
        'qi.shipping_carrier',
        'qi.package_number'
      )
      .innerJoin('q_shopee_invoices as qi', 'qid.order_sn', 'qi.order_sn')
      .count({ invoices: 'qid.order_sn' })
      .sum({ qty: 'qid.model_quantity_purchased' })
      .where('qid.status', 0)
      .andWhere('qid.id_q_shopee', payload.id)
      .groupBy(
        'qid.id_q_shopee',
        'qid.item_id',
        'qid.model_id',
        'qi.shipping_carrier',
        'qi.package_number'
      )
      .orderBy([
        { column: 'qid.order_sn', order: 'asc' },
        { column: 'qty', order: 'desc' }
      ]);

      // .andWhereRaw(`date(qid.create_time) = date('now','localtime')`)
    return await query;
    // .andWhere('id_q_shopee', payload.id)
  }
  async viewQShopeePosBySNPrinted(payload: any) {
  const query = await db('q_shopee_invoices_detail_bulk as qid')
    .select(
      'qid.item_id',
      'qid.item_name',
      'qid.model_id',
      'qid.model_name',
      'qid.image_url',
      'qi.shipping_carrier',
      'qi.labelshopee',
    )
    .innerJoin('q_shopee_invoices_bulk as qi', 'qid.order_sn', 'qi.order_sn')
    .count({ invoices: 'qid.order_sn' })
    .sum({ qty: 'qid.model_quantity_purchased' })
    .where('qid.status', 0)
    .andWhereRaw(`date(qid.create_time) = date('now','localtime')`)
    .whereNotNull('qi.labelshopee')
    .andWhereRaw(`trim(qi.labelshopee) <> ''`)
    .groupBy('qid.item_id', 'qid.model_id', 'qi.shipping_carrier')
    .orderBy('qty', 'desc');
  return query;
}
async viewQShopeePosBySNError(payload: any) {
  const query = await db('q_shopee_invoices_detail_bulk as qid')
    .select(
      'qid.item_id',
      'qid.item_name',
      'qid.model_id',
      'qid.model_name',
      'qid.image_url',
      'qi.shipping_carrier',
      'qi.labelshopee',
    )
    .innerJoin('q_shopee_invoices_bulk as qi', 'qid.order_sn', 'qi.order_sn')
    .count({ invoices: 'qid.order_sn' })
    .sum({ qty: 'qid.model_quantity_purchased' })
    .where('qid.status', 0)
    .andWhereRaw(`date(qid.create_time) = date('now','localtime')`)
    .andWhere((builder: { whereNull: (arg0: string) => { (): any; new(): any; orWhereRaw: { (arg0: string): void; new(): any; }; }; }) => {
      builder.whereNull('qi.labelshopee').orWhereRaw(`trim(qi.labelshopee) = ''`);
    })
    .groupBy('qid.item_id', 'qid.model_id', 'qi.shipping_carrier')
    .orderBy('qty', 'desc');

  return query;
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

  async selectSKUOnTransaction() {
    //memang q_shopee_invoices_detail untuk melihat product yang aktif
    const query = await db('q_shopee_invoices_detail_bulk')
      .select(
        'item_id',
        'item_sku',
        'item_name',
        'model_id',
        'model_name',
        'image_url',
        db.raw(
          "CONCAT(REPLACE(item_id, '.0', ''), model_id) AS id_stock"
        )
      ).where("wh_id", 2).groupBy('item_id',
        'item_sku',
        'item_name',
        'model_id',
        'model_name',
        'image_url')
      .orderBy('item_name', 'asc');
    return await query;
  }
  async selectStockOpnameDetailByID(payload: any) {
    //memang q_shopee_invoices_detail untuk melihat product yang aktif
    // console.log("######## PAYLOAD ", payload);
    const query = await db('stock_opname_detail')
      .select(
        'opname_id',
        'product_id',
        'system_qty',
        'physical_qty',
        'adjustment_qty',
        'opname_date',
        'created_by',
        'id_opname',
        'item_id',
        'product_name',
        'model_id',
        'model_name'

      ).where("id_opname", payload.id_opname).orderBy('opname_id', 'desc');
    return await query;
  }

  //   async selectStockWithSummary(payload: any) {
  //     const sub = db('q_shopee_invoices_detail_bulk')
  //   .select('item_id', 'model_id')
  //   .sum('model_quantity_purchased as sum_qty')
  //   .where('create_time', '>', payload.opname_date)
  //   .groupBy('item_id', 'model_id')
  //   .as('b');
  // const query = await db('stock_opname_detail as s')
  //   .where('s.id_opname', payload.id_opname)
  //   .leftJoin(sub, (join: Knex.JoinClause) => {
  //     join.on('s.item_id', '=', 'b.item_id').andOn('s.model_id', '=', 'b.model_id');
  //   })
  //   .select(
  //     's.opname_id',
  //     's.product_id',
  //     db.raw('COALESCE(b.sum_qty,0) AS system_qty'),
  //     's.physical_qty',
  //     's.adjustment_qty',
  //     's.opname_date',
  //     's.created_by',
  //     's.id_opname',
  //     's.item_id',
  //     's.product_name',
  //     's.model_id',
  //     's.model_name'
  //   )
  //   .orderBy('s.opname_date', 'asc');

  //     return query;
  //   }
  async selectStockWithSummary(payload: any) {
    // 🔹 Subquery: rekap per model_id, ambil image_url mewakili model tersebut
    const sub = db('q_shopee_invoices_detail_bulk')
      .select(
        'model_id',
        db.raw('MAX(item_id) as item_id'),     // ambil satu item_id agar bisa join
        db.raw('MAX(image_url) as image_url')  // ambil satu image_url per model_id
      )
      .sum({ sum_qty: 'model_quantity_purchased' })
      .where('create_time', '>', payload.opname_date)
      .groupBy('model_id') // ✅ cukup per model_id saja
      .as('b');

    // 🔹 Query utama
    const query = await db('stock_opname_detail as s')
      .where('s.id_opname', payload.id_opname)
      .leftJoin(sub, (join: Knex.JoinClause) => {
        join.on('s.model_id', '=', 'b.model_id'); // ✅ join hanya per model_id
      })
      .select(
        's.opname_id',
        's.product_id',
        db.raw('COALESCE(b.sum_qty, 0) AS system_qty'),
        's.physical_qty',
        's.adjustment_qty',
        's.opname_date',
        's.created_by',
        's.id_opname',
        's.item_id',
        's.product_name',
        's.model_id',
        's.model_name',
        'b.image_url' // ✅ image_url sesuai model_id
      )
      .orderBy('s.opname_date', 'asc');

    return query;
  }
  async selectStockWithSummaryAdj(payload: any) {
    const sub = db('q_shopee_invoices_detail_bulk')
      .select('item_id', 'model_id')
      .sum('model_quantity_purchased as sum_qty')
      .where('create_time', '>', payload.opname_date)
      .groupBy('item_id', 'model_id')
      .as('b');
    const query = await db('stock_opname_detail as s')
      .where('s.id_opname', payload.id_opname)
      .leftJoin(sub, (join: Knex.JoinClause) => {
        join.on('s.item_id', '=', 'b.item_id').andOn('s.model_id', '=', 'b.model_id');
      })
      .select(
        's.opname_id',
        's.product_id',
        db.raw('COALESCE(b.sum_qty,0) AS system_qty'),
        's.physical_qty',
        db.raw('(s.physical_qty - COALESCE(b.sum_qty, 0)) AS adjustment_qty'),
        's.opname_date',
        's.created_by',
        's.id_opname',
        's.item_id',
        's.product_name',
        's.model_id',
        's.model_name'
      )
      .orderBy('s.opname_date', 'asc');

    return query;
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
  async selectPackageIfTaken(payload: any) {
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
      .where('status', '>', 0)
      .andWhere('order_sn', payload.order_sn).first()
    return await query;
  }
  async selectItemsPackagesAvailable(payload: any, userinfo: any) {
    //#######################CHECK APAKAH q_shopee_invoices SUDAH TERUPDATE STATUSNYA######################
    const checkStatus = await db('q_shopee_invoices').select('status').where('order_sn', payload.order_sn).first();
    //######################################################
    if (checkStatus.status === 0) {
      //################################ UPDATE q_shopee_invoices dulu bahwa sudah di take _1
      const updateStatus = await db('q_shopee_invoices').update({
        status: 1,
        updated_by: userinfo.iduser,
        updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
      }).where('order_sn', payload.order_sn).returning('id_q_shopee');
      //#######################################################
      if (updateStatus) {
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
  async selectItemsToPrint(payload: any, userinfo: any) {
    // console.log("ON REPO ", payload);
    //#######################CHECK APAKAH q_shopee_invoices SUDAH TERUPDATE STATUSNYA######################
    const checkStatus = await db('q_shopee_invoices').select('status').where('order_sn', payload.order_sn).first();
    //######################################################
    if (checkStatus.status === 1) {
      //################################ UPDATE q_shopee_invoices dulu bahwa sudah di take _1
      const updateStatus = await db('q_shopee_invoices').update({
        status: 3,
        updated_by: userinfo.iduser,
        updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
      }).where('order_sn', payload.order_sn).returning('id_q_shopee');
      //#######################################################
      if (updateStatus) {
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
  async getCountInvoicesAvailable() {
    const packageAvailable = await this.selectPackagesAvailable();
    console.log("JUMLAH RECORD RESI : ", packageAvailable.length);
    const result = { invoiceQty: packageAvailable.length };
    return result;
  }
  async getCountSKUAvailable() {
    const packageAvailable = await this.selectSKUAvailable();
    const result = { skuQty: packageAvailable.length };
    return result;
  }
  async updateItemsPackagesAvailable(payload: any, userInfo: any) {

    const query = await db('q_shopee_invoices_detail').update(
      {
        status: 1,
        updated_by: userInfo.userid,
        updated_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
      }
    ).where("id_q_shopee", payload.id_q_shopee).andWhere("order_sn", payload.order_sn).andWhere("item_id", payload.item_id).returning('id_q_shopee');
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
    ]).from('q_shopee as qs').leftJoin("m_user as mu", "qs.created_by", "mu.iduser").whereRaw('DATE(qs.created_at) = ?', [today]).orderBy("qs.created_at", "desc");
    return result;
  }
  async selectQShopeeToday() {
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
    ]).from('q_shopee as qs')
      .leftJoin("m_user as mu", "qs.created_by", "mu.iduser").whereRaw('DATE(qs.created_at) = ?', [today]).orderBy("qs.created_at", "desc").first();
    // console.log("DB SELECT SHOPPY TODAY ", result);
    if (result) {
      // Hitung jumlah order_sn unik dari q_shopee_invoices_detail untuk hari ini
      // const totalResi = await db('q_shopee_invoices_detail as qsid')
      //   .countDistinct('qsid.order_sn as totalresi')
      //   .whereRaw('DATE(qsid.create_time) = ?', [today])
      //   .first();
      const totalResi = await db('q_shopee_invoices as qsi')
        .count('qsi.order_sn as totalresi')
        .where('qsi.id_q_shopee', result.id)
        .first();

      result.totalresi = totalResi?.totalresi ?? 0;
    }
    return result;
  }
  async selectQShopeeAttributes() {
    const result = await db.select([
      'ms.id',
      'ms.access_token',
      'ms.refresh_token',
      'ms.shop_id',
      'ms.code',
      'ms.client_id',
      'ms.client_secret',
      'ms.redirect_uri',
      'ms.base_api'
    ]).from('m_shopee as ms').first();
    return result;
  }
  async updateQShopeeAttributes(payload: any) {
    const query = await db('m_shopee').update(payload).returning('id');
    return await query;
  }
  async getSMTPVariables() {
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
  async getShippingVariables(flagcode: number) {
    const query = await db('m_logistic')
      .select(
        'address_id',
        'region',
        'state',
        'city',
        'district',
        'town',
        'address',
        'zipcode',
        'address_flag',
        'time_slot_list'
      ).where("address_flag", flagcode).first();
    return await query;
  }
  //################# SHOPEE ATTRB ###############################
  async selectShopeeAPIAtribute() {
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
  async selectShopeeJobsByID(payload: any) {
    const result = await db.select([
      'qs.id',
      'qs.listresi'
    ]).from('q_shopee as qs').where("id", payload.id).first();
    return result;
  }
  async updateShopeeToken(payload: any) {
    logInfo("Update data token : ");
    const query = await db('m_shopee').update(
      {
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        update_at: payload.update_at
      }
    ).where("id", '1000001').returning('id');

    return await query;
  }
  async convertDateFormat(dateStr: string): Promise<string> {
    // Misal inputnya "13-08-2025"
    console.log("CONVERT DATE FROM ", dateStr);
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }
  async transformInventoryItems(items: any[]): Promise<any[]> {
    return items.map((item) => {
      const cleanItemId = item.item_id.replace(/\.0$/, ""); // hilangkan .0
      const cleanModelId = item.model_id; // hilangkan .0
      return {
        product_id: `${cleanItemId}${cleanModelId}`, // gabung jadi string
        trx_date: item.create_time,
        trx_type: "OUT", // static
        qty: item.model_quantity_purchased,
        ref_id: item.order_sn,
        note: "",
        warehouse_id: 2, // static
      };
    });
  }

}
