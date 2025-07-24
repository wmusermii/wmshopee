// import { UserRepository } from "../repositories/user.repository";
// import { ApiResponse } from "../utils/apiResponse";
import { ShopeeRepository } from "../repositories/shopee.repository";
import { ApiResponse } from "../utils/apiResponse";
import { logInfo } from "../utils/logger";

export class ApiService {
  private shopeeRepo = new ShopeeRepository();
  async qShopeeInsert(payload: any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.saveQShopee(payload,userinfo);
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
