// import { UserRepository } from "../repositories/user.repository";
// import { ApiResponse } from "../utils/apiResponse";
import { ShopeeRepository } from "../repositories/shopee.repository";
import { ApiResponse } from "../utils/apiResponse";
import { logInfo } from "../utils/logger";
import { ShopeeService } from "./shopee/shopee.service";

export class ApiService {
  private shopeeRepo = new ShopeeRepository();
  private apiShopeeService = new ShopeeService();//Jangan Di hapus dahulu
  async qShopeeInsert(payload: any, userinfo: any) {
    const formattedDate = new Date(payload.fromdate).toISOString().substring(0, 10);
    const orderList = await this.apiShopeeService.getOrderList(formattedDate, payload.fromtime, payload.totime);
    const totalResi = orderList.length;
    logInfo("✅ Sudah di List ", totalResi);
    let arrayOrder = totalResi > 0 ? await this.extractOrderSNList(orderList) : [{}];
    payload.totalresi = totalResi; payload.listresi = JSON.stringify(arrayOrder);
    const shopeeResult = await this.shopeeRepo.saveQShopee(payload, userinfo);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to insert data!");
    //########################################################################
    const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
    if (!rowQueryShopee) {
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    } else {
      return ApiResponse.success(rowQueryShopee, "Records found");
    }
  }
  async qShopeeJobs(payload: any, userinfo: any) {

    const resArray = await this.shopeeRepo.selectShopeeJobsByID(payload);
    if (!resArray) {
      return ApiResponse.successNoData({}, "No data available");
    }
    const dataStringArray = JSON.parse(resArray.listresi);
    // logInfo("Data DB ",dataStringArray);
    const invoicesList = await this.apiShopeeService.getOrderDetail(dataStringArray);

    if (!invoicesList) return ApiResponse.successNoData(invoicesList, "Unable to generate jobs data!");

    const listResponse = await this.saveShopeeInvoices(payload.id, invoicesList); //Input Invoices;

    // if(!shopeeResult) return ApiResponse.successNoData(shopeeResult,"Unable to insert data!");
    // //########################################################################
    const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
    if (!rowQueryShopee) {
      return ApiResponse.successNoData(rowQueryShopee, "Records found!");
    } else {
      return ApiResponse.success(rowQueryShopee, "Records found");
    }
  }
  async qShopeeGet(userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectQShopeeAll();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to insert data!");
    //################## Berhasil Isi #######################
    // if(shopeeResult){
    const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
    if (!rowQueryShopee) {
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    } else {
      return ApiResponse.success(rowQueryShopee, "Records found");
    }
    // }
  }
  async extractOrderSNList(orderList: any[]): Promise<string[]> {
    return orderList.map(item => item.order_sn);
  }
  async saveShopeeInvoices(id: number, orderDetails: any[]) {
    // 1. Persiapan data untuk table q_shopee_invoices
    const invoices = orderDetails.map((order) => ({
      id_q_shopee: id,
      create_time: this.toDatetimeString(order.create_time),
      order_status: order.order_status,
      total_amount: order.total_amount,
      ship_by_date: this.toDatetimeString(order.ship_by_date),
      status: 0,
      order_sn: order.order_sn
    }));

    // 2. Persiapan data untuk table q_shopee_invoices_detail
    const invoiceDetails: any[] = [];

    orderDetails.forEach(order => {
      const orderSn = order.order_sn;
      const items = order.item_list || []; // Jika tidak ada item_list, gunakan array kosong

      items.forEach((item: any) => {
        invoiceDetails.push({
          id_q_shopee: id,
          order_sn: orderSn,
          item_id: item.item_id,
          item_name: item.item_name,
          item_sku: item.item_sku,
          model_id: item.model_id,
          model_name: item.model_name,
          model_quantity_purchased: item.model_quantity_purchased,
          image_url: item.image_info?.image_url || null
        });
      });
    });

    // 3. Insert ke kedua tabel
    const invoicesResult = await this.shopeeRepo.saveQShopeeInvoices(invoices);
    const detailsResult = await this.shopeeRepo.saveQShopeeInvoicesDetail(invoiceDetails); // <- tambahkan fungsi ini
    const updateQShopee = await this.shopeeRepo.updateQShopee({ id: id });

    // 4. Ambil semua data untuk dikembalikan
    const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
    if (!rowQueryShopee) {
      return ApiResponse.successNoData(null, "Unable to get data!");
    } else {
      return ApiResponse.success(rowQueryShopee, "Records found");
    }
  }

  private toDatetimeString(unix: number): string {
    const date = new Date(unix * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
//   {
//   "advance_package": false,
//   "booking_sn": "",
//   "cod": false,
//   "create_time": 1753664279,
//   "currency": "IDR",
//   "days_to_ship": 2,
//   "item_list": [
//     {
//       "add_on_deal": false,
//       "add_on_deal_id": 0,
//       "image_info": {
//         "image_url": "https://cf.shopee.co.id/file/sg-11134201-23010-8vtqpav1gmmv88_tn"
//       },
//       "is_b2c_owned_item": false,
//       "is_prescription_item": false,
//       "item_id": 23016158204,
//       "item_name": "Gesper Sabuk Ikat Pinggang Anak Sekolah SD SMP SMA Dan Pramuka  Madrasah Laki laki perempuan",
//       "item_sku": "",
//       "main_item": false,
//       "model_discounted_price": 10672,
//       "model_id": 183672608214,
//       "model_name": "GESPER SD 90cm",
//       "model_original_price": 10672,
//       "model_quantity_purchased": 1,
//       "model_sku": "",
//       "order_item_id": 23016158204,
//       "product_location_id": [
//         "IDZ"
//       ],
//       "promotion_group_id": 0,
//       "promotion_id": 0,
//       "promotion_type": "",
//       "weight": 0.055,
//       "wholesale": false
//     },
//     {
//       "add_on_deal": false,
//       "add_on_deal_id": 0,
//       "image_info": {
//         "image_url": "https://cf.shopee.co.id/file/id-11134207-7qul2-lhfzoxjhl6qcb8_tn"
//       },
//       "is_b2c_owned_item": false,
//       "is_prescription_item": false,
//       "item_id": 23820424910,
//       "item_name": "Dasi SD Sekolah Bordir Sablon Putra Putri Anak",
//       "item_sku": "",
//       "main_item": false,
//       "model_discounted_price": 7280,
//       "model_id": 235263566887,
//       "model_name": "Karet Bordir,Putra",
//       "model_original_price": 7280,
//       "model_quantity_purchased": 1,
//       "model_sku": "",
//       "order_item_id": 23820424910,
//       "product_location_id": [
//         "IDZ"
//       ],
//       "promotion_group_id": 0,
//       "promotion_id": 0,
//       "promotion_type": "",
//       "weight": 0.02,
//       "wholesale": false
//     }
//   ],
//   "message_to_seller": "",
//   "order_sn": "250728AJGGSCB3",
//   "order_status": "SHIPPED",
//   "region": "ID",
//   "reverse_shipping_fee": 0,
//   "ship_by_date": 1753721999,
//   "total_amount": 21952,
//   "update_time": 1753688433
// }
