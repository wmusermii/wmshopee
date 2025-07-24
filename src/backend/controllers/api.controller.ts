
import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/ResponseHelper';
import { logError, logInfo } from '../utils/logger';
import { ApiResponse } from '../utils/apiResponse';
import { ApiService } from '../services/api.service';
const apiService = new ApiService();
export function echo(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = {code:1, message:"Echo test workeds from controller"}
    ResponseHelper.send(res, ApiResponse.success(payload,"Echoing!"));
  } catch (error) {
    logError("Error api.controller : ", error)
    next(error);
    // ResponseHelper.send(res,ApiResponse.serverError(error+""));

  }
}
//##################### PROCESS SHOPEE ######################
export async function generateQShopee(req: Request, res: Response, next: NextFunction) {
  const { date,fromtime, totime } = req.body;
  try {
    let bodyPayload = {fromdate:date, fromtime:fromtime, totime:totime}
    const userInfo:any = req.userInfo;
//     Payload :  {
//   fromdate: '2025-07-24T05:16:23.890Z',
//   fromtime: '12:00:01',
//   totime: '15:00:01'
// }
    const inserResult = await apiService.qShopeeInsert(bodyPayload,userInfo);
    if(inserResult.code === 20000 && inserResult.data.length > 0) {
      await ResponseHelper.send(res, ApiResponse.success(req.body,"Generate success"));return;
    } else {
      await ResponseHelper.send(res,ApiResponse.successNoData([],"Unable to generate data"));
      return;
    }
    // HASIL INSERT :  {"code":20000,"message":"Records found","data":[{"id":2}]}
    // logInfo("HASIL INSERT : ",inserResult)
    // const payload = {code:1, message:"Login test workeds from controller"}
    // const user = await authService.login(username, password);
    // logInfo("Auth.controller ",user);
    // const data:any = user.data;
    // if(user.code === 20000) {
    //   const token = await EncryptDecryptJwt.generateToken(data);
    //   // logInfo("Token created ",token)
    //   for (const key in user.data) {
    //     if (user.data.hasOwnProperty(key)) {
    //       delete user.data[key];
    //     }
    //   }
    //   user.data.token = token;
    // }
    // await ResponseHelper.send(res, ApiResponse.success(req.body,"Generate success"));return;
  } catch (error) {
    logError("Error auth.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}

//##################### PROCESS ELSE ######################
