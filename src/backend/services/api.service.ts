// import { UserRepository } from "../repositories/user.repository";
// import { ApiResponse } from "../utils/apiResponse";
import { ShopeeRepository } from "../repositories/shopee.repository";
import { ApiResponse } from "../utils/apiResponse";
import { logInfo } from "../utils/logger";
import { getOrderListAllFromDb } from "./shopee/shopee.service";

export class ApiService {
  private shopeeRepo = new ShopeeRepository();
  async qShopeeInsert(payload: any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.saveQShopee(payload,userinfo);
    if(!shopeeResult) return ApiResponse.successNoData(shopeeResult,"Unable to insert data!");
    //################## Berhasil Isi #######################
    //  fromtime: payload.fromtime,
    //       totime: payload.totime,
    //       created_by: userInfo.iduser,
    //       created_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
    //       datepick: formattedDate
    const orderList = await getOrderListAllFromDb(119070787,payload.datepick,payload.fromtime,payload.totime);

    logInfo("Data order list : ", orderList);

    //########################################################################
      const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
      if(!rowQueryShopee) {
        return ApiResponse.successNoData(shopeeResult,"Unable to get data!");
      } else {
        return ApiResponse.success(rowQueryShopee,"Records found");
      }

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
}
