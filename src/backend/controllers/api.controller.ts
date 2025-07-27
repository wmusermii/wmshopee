
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
    const inserResult = await apiService.qShopeeInsert(bodyPayload,userInfo);
    if(inserResult.code === 20000 && inserResult.data.length > 0) {
      await ResponseHelper.send(res, inserResult);return;
    } else {
      await ResponseHelper.send(res,ApiResponse.successNoData([],"Unable to generate data"));
      return;
    }
  } catch (error) {
    logError("Error auth.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
export async function getQShopee(req: Request, res: Response, next: NextFunction) {
  const { date,fromtime, totime } = req.body;
  try {
    let bodyPayload = {fromdate:date, fromtime:fromtime, totime:totime}
    const userInfo:any = req.userInfo;
    const inserResult = await apiService.qShopeeInsert(bodyPayload,userInfo);
    if(inserResult.code === 20000 && inserResult.data.length > 0) {
      await ResponseHelper.send(res, inserResult);return;
    } else {
      await ResponseHelper.send(res,ApiResponse.successNoData([],"Unable to generate data"));
      return;
    }
  } catch (error) {
    logError("Error auth.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
//##################### PROCESS ELSE ######################
