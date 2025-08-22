import db from '../database/client';

export class WarehouseRepository {
  async findAllWarehouse():Promise<any[]> {
    const result = await db.select([
      'mw.warehouse_id',
      'mw.warehouse_code',
      'mw.warehouse_name',
      'mw.is_store'
    ]).from('m_warehouse as mw');
    return result;
  }
  async findWarehouseById(payload:string):Promise<any> {
    const result = await db.select([
      'mw.warehouse_id',
      'mw.warehouse_code',
      'mw.warehouse_name',
      'mw.is_store'
    ]).from('m_warehouse as mw').where("mw.warehouse_id", payload).first();
    return result;
  }
  async insertWarehouse(payload:any):Promise<any> {
     const query = await db('m_warehouse').insert(payload).returning("warehouse_id");
    return await query;
  }
  async updateWarehouse(payload:any, warehouse_id:string):Promise<any> {
     const query = await db('m_warehouse').update(payload).where("warehouse_id",warehouse_id).returning("warehouse_id");
    return await query;
  }
}
