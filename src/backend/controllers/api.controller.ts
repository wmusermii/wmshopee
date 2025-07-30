
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
    logError("Error api.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
export async function generateQShopeeJobs(req: Request, res: Response, next: NextFunction) {
  //     {
//   "id": 2,
//   "datepick": "2025-07-28",
//   "fromtime": "05:00:01",
//   "totime": "08:00:01",
//   "created_by": "102345690",
//   "fullname": "Super Admin",
//   "status": 0,
//   "totalresi": 112,
//   "created_at": "2025-07-28 20:02:32"
// }
  const { id,datepick,fromtime,totime,created_by,fullname,status,totalresi,created_at } = req.body;
  try {
    let bodyPayload = {id:id}
    const userInfo:any = req.userInfo;
    const jobsResult = await apiService.qShopeeJobs(bodyPayload,userInfo);
    logInfo("JOB RESPONSE ", jobsResult)

      await ResponseHelper.send(res, jobsResult);return;

  } catch (error) {
    logError("Error api.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
export async function getQShopee(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("####################################### getQSHopee");
    const userInfo:any = req.userInfo;
    const inserResult = await apiService.qShopeeGet(userInfo);
    if(inserResult.code === 20000 && inserResult.data.length > 0) {
      await ResponseHelper.send(res, inserResult);return;
    } else {
      await ResponseHelper.send(res,ApiResponse.successNoData([],"Unable to generate data"));
      return;
    }
  } catch (error) {
    logError("Error api.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
export async function viewQShopeePosItem(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("####################################### viewQShopeePosItem");
    const { id } = req.body;
    const userInfo:any = req.userInfo;
    const viewResult = await apiService.viewShopeePosByID({id:id},userInfo);
    // logInfo("Controller hasil View Result ",viewResult)
    // await ResponseHelper.send(res,ApiResponse.success(viewResult,"Success"));
    if(viewResult.code === 20000 && viewResult.data.length > 0) {
      await ResponseHelper.send(res,ApiResponse.success(viewResult,"Success"));return;
    } else {
      await ResponseHelper.send(res,ApiResponse.successNoData([],"No available data"));
      return;
    }
  } catch (error) {
    logError("Error api.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
//##################### PROCESS ELSE ######################
