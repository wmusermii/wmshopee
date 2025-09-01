import db from '../database/client';

export class OpnameRepository {
  async findAllHeaderOpname():Promise<any[]> {
    const result = await db.select([
      'so.id_opname',
      'so.opname_date',
      'so.wh_id',
      'mw.warehouse_name',
      'mw.is_store',
      'so.status',
      'so.opname_by'
    ]).from('stock_opname as so').innerJoin("m_warehouse as mw","so.wh_id", "mw.warehouse_id").orderBy("so.opname_date", "desc");
    return result;
  }
  async findHeaderOpnameById(payload:string):Promise<any> {
    const result = await db.select([
      'so.id_opname',
      'so.opname_date',
      'so.wh_id',
      'mw.warehouse_name',
      'so.status',
      'so.opname_by'
    ]).from('stock_opname as so').innerJoin("m_warehouse as mw","so.wh_id", "mw.warehouse_id").orderBy("so.opname_date", "desc");
    return result;
  }
  async insertOpname(payload:any):Promise<any> {
    // console.log("################ PAYLOAD ", payload);
     const query = await db('stock_opname').insert(payload).returning("id_opname");
    return await query;
  }
  async insertDetailOpname(payload:any):Promise<any> {
    // console.log("################ PAYLOAD DETAIL ", payload);
     const query = await db('stock_opname_detail').insert(payload).returning("opname_id");
    return await query;
  }
  async updateOpname(payload:any, id_opname:string):Promise<any> {
     const query = await db('stock_opname').update(payload).where("id_opname",id_opname).returning("id_opname");
    return await query;
  }
  async deleteOpname(id_opname:string):Promise<any> {
     const query = await db('stock_opname').delete().where("id_opname",id_opname);
    return await query;
  }
}
