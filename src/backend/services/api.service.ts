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
    const orderList = await this.apiShopeeService.getOrderList(formattedDate,payload.fromtime,payload.totime);
    const totalResi = orderList.length;
    logInfo("✅ Sudah di List ", totalResi);
    let arrayOrder = totalResi > 0?await this.extractOrderSNList(orderList):[{}];
    payload.totalresi = totalResi;payload.listresi= JSON.stringify(arrayOrder);
    const shopeeResult = await this.shopeeRepo.saveQShopee(payload,userinfo);
    if(!shopeeResult) return ApiResponse.successNoData(shopeeResult,"Unable to insert data!");
    //########################################################################
      const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
      if(!rowQueryShopee) {
        return ApiResponse.successNoData(shopeeResult,"Unable to get data!");
      } else {
        return ApiResponse.success(rowQueryShopee,"Records found");
      }
  }
  async qShopeeJobs(payload: any, userinfo: any) {
    // const formattedDate = new Date(payload.fromdate).toISOString().substring(0, 10);
    // const orderList = await this.apiShopeeService.getOrderList(formattedDate,payload.fromtime,payload.totime);
    // const totalResi = orderList.length;
    // logInfo("✅ Sudah di List ", totalResi);
    // let arrayOrder = totalResi > 0?await this.extractOrderSNList(orderList):[{}];
    // payload.totalresi = totalResi;payload.listresi= JSON.stringify(arrayOrder);
    // const shopeeResult = await this.shopeeRepo.saveQShopee(payload,userinfo);
    const resArray = await this.shopeeRepo.selectShopeeJobsByID(payload);
    if(!resArray) {
      return ApiResponse.successNoData({},"No data available");
    }
    const dataStringArray = JSON.parse(resArray.listresi);
    // logInfo("Data DB ",dataStringArray);
    const invoicesList = await this.apiShopeeService.getOrderDetail(dataStringArray);
    logInfo("Data API ",invoicesList);
    const shopeeResult: any[] = []



    // if(!shopeeResult) return ApiResponse.successNoData(shopeeResult,"Unable to insert data!");
    // //########################################################################
    //   const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
    //   if(!rowQueryShopee) {
        return ApiResponse.successNoData(shopeeResult,"Unable to get data!");
    //   } else {
    //     return ApiResponse.success(rowQueryShopee,"Records found");
    //   }
  }
  async qShopeeGet(userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectQShopeeAll();
    if(!shopeeResult) return ApiResponse.successNoData(shopeeResult,"Unable to insert data!");
    //################## Berhasil Isi #######################
    // if(shopeeResult){
      const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
      if(!rowQueryShopee) {
        return ApiResponse.successNoData(shopeeResult,"Unable to get data!");
      } else {
        return ApiResponse.success(rowQueryShopee,"Records found");
      }
    // }
  }
  async extractOrderSNList(orderList: any[]): Promise<string[]> {
  return orderList.map(item => item.order_sn);
  }
}
