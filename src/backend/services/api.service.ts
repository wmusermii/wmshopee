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
    return ApiResponse.success(shopeeResult,"Records found");
  }
}
