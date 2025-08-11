
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
export async function generateQShopeeCurrent(req: Request, res: Response, next: NextFunction) {
  const { date,fromtime, totime } = req.body;
  try {
    let bodyPayload = {fromdate:date, fromtime:fromtime, totime:totime}
    const userInfo:any = req.userInfo;
    const inserResult = await apiService.qShopeeInsertCurrent(bodyPayload,userInfo);
    console.log("################################## generateQShopeeCurrent : ",inserResult);
    if(inserResult.code === 20000) {
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
export async function getShopPerformance(req: Request, res: Response, next: NextFunction) {
  try {
    const shopperformanceResult = await apiService.qShopeePerformance();
    if(shopperformanceResult.code === 20000) {
      await ResponseHelper.send(res, shopperformanceResult);return;
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
export async function getShopInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const shopperinfoResult = await apiService.qShopeeInfo();
    if(shopperinfoResult.code === 20000) {
      await ResponseHelper.send(res, shopperinfoResult);return;
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
  const { id,datepick,fromtime,totime,created_by,fullname,status,totalresi,created_at } = req.body;
  try {
    let bodyPayload = {id:id}
    const userInfo:any = req.userInfo;
    const jobsResult = await apiService.qShopeeJobs(bodyPayload,userInfo);
    // logInfo("JOB RESPONSE ", jobsResult)

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
export async function getQShopeeToday(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("####################################### getQShopeeToday");
    const userInfo:any = req.userInfo;
    const inserResult = await apiService.qShopeeGetToday(userInfo);
    if(inserResult.code === 20000) {
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

export async function getPackageJobAvailable(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("####################################### getPackageJobAvailable");
    const userInfo:any = req.userInfo;
    const packageResult = await apiService.getPackagesAvailable(userInfo);
    if(packageResult.code === 20000 && packageResult.data.length > 0) {
      await ResponseHelper.send(res, packageResult);return;
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
export async function checkPackageTaken(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("####################################### getItemsInPackage");
    const { order_sn } = req.body;
    const userInfo:any = req.userInfo;
    const payload = {order_sn:order_sn}
    const packageResult = await apiService.getPackagesIstaken(payload);
    if(packageResult.code === 20000 && packageResult.data.length > 0) {
      await ResponseHelper.send(res, packageResult);return;
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



export async function getItemsInPackage(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("####################################### getItemsInPackage");
    const { order_sn } = req.body;
    const userInfo:any = req.userInfo;
    const payload = {order_sn:order_sn}
    const packageResult = await apiService.getItemInPackagesAvailable(payload,userInfo);
    if(packageResult.code === 20000 && packageResult.data.length > 0) {
      await ResponseHelper.send(res, packageResult);return;
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
export async function updateItemsInPackage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id_q_shopee, order_sn,item_id} = req.body;
    const userInfo:any = req.userInfo;
    const payload = {id_q_shopee:id_q_shopee,order_sn:order_sn,item_id:item_id }
    // console.log("####################################### updateItemsInPackage ", payload);
    const packageResult = await apiService.updateItemInPackagesAvailable(payload,userInfo);
    if(packageResult.code === 20000 && packageResult.data.length > 0) {
      await ResponseHelper.send(res, packageResult);return;
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

export async function getCountInvoicesAvailable(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("####################################### getCountInvoicesAvailable");
    // const { order_sn } = req.body;
    const userInfo:any = req.userInfo;
    // const payload = {order_sn:order_sn}
    const packageResult = await apiService.getCountInvoicesAvailable();
    if(packageResult.code === 20000) {
      await ResponseHelper.send(res, packageResult);return;
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
export async function getCountSKUAvailable(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("####################################### getCountSKUAvailable");
    // const { order_sn } = req.body;
    const userInfo:any = req.userInfo;
    // const payload = {order_sn:order_sn}
    const packageResult = await apiService.getCountSKUAvailable();
    if(packageResult.code === 20000) {
      await ResponseHelper.send(res, packageResult);return;
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
export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {

    const { iduser, username,fullname,mobile,email,groupname,changepassword,password,cpassword} = req.body;
    const userInfo:any = req.userInfo;
    const payload = {iduser:iduser, username:username,fullname:fullname,mobile:mobile,email:email,groupname:groupname,password:password,changepassword:changepassword }
    console.log("####################################### updateUser ", payload);
    const updateResult = await apiService.updateUser(payload,userInfo);
    console.log("####################################### updateUser ", updateResult);
    if(updateResult.code === 20000) {
      await ResponseHelper.send(res, updateResult);return;
    } else {
      await ResponseHelper.send(res,ApiResponse.successNoData([],"Unable to generate data"));return
    }
  } catch (error) {
    logError("Error api.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
//##################### PROCESS ELSE ######################
export async function getAllSKUAvailable(req: Request, res: Response, next: NextFunction) {
 try {
    console.log("####################################### getCountSKUAvailable");
    const userInfo:any = req.userInfo;
    const packageResult = await apiService.getAllSKUAvailable();
    if(packageResult.code === 20000) {
      await ResponseHelper.send(res, packageResult);return;
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
export async function sendingEmailTo(req: Request, res: Response, next: NextFunction) {
  try {
    const { to, subject, message} = req.body;
    const userInfo:any = req.userInfo;
    const packageResult = await apiService.sendEmailNotification(to,subject,message);
    if(packageResult.code === 20000) {
      await ResponseHelper.send(res, packageResult);return;
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
export async function sendingPrinting(req: Request, res: Response, next: NextFunction) {
  try {
    const { order_sn } = req.body;
    const userInfo:any = req.userInfo;
    const packageResult = await apiService.sendPrinting(order_sn,userInfo );
    // if(packageResult.code === 20000) {
    //   await ResponseHelper.send(res, packageResult);return;
    // } else {
      await ResponseHelper.send(res,packageResult);
    //   return;
    // }
  } catch (error) {
    logError("Error api.controller : ", error)
    // next(error);
    return await ResponseHelper.send(res,ApiResponse.serverError(error+""));return;
  }
}
