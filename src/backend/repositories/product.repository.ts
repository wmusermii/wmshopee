import db from '../database/client';

export class ProductRepository {
  async findAllProduct() {
    const result = await db.select([
      'mp.item_id',
      'mp.item_sku',
      'mp.item_name',
      'mp.item_condition',
      'mp.item_status',
      'mp.orgBrand',
      'mp.filename'
    ]).from('m_product as mp');
    return result;
  }
}
