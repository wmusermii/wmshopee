import { UserRepository } from "../repositories/user.repository";
import { ApiResponse } from "../utils/apiResponse";
import { logInfo } from "../utils/logger";

export class AuthService {
  private repository = new UserRepository();
  async login(username: string, password: string) {
    // const user = await this.repository.findByUsername(username);
    const user = await this.repository.findByUsernamePassword(username, password);
    if(!user) return ApiResponse.successNoData(user,"Incorrect Username and Password!");
    return ApiResponse.success(user,"Records found");
  }
  async selectGetUserByUserID(username: string) {
    const user = await this.repository.findByUsername(username);
    if(!user) return ApiResponse.successNoData(user,"Incorrect Username and Password!");
    return ApiResponse.success(user,"Records found");
  }

}
