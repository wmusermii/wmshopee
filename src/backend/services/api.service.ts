// import { UserRepository } from "../repositories/user.repository";
// import { ApiResponse } from "../utils/apiResponse";
import { ShopeeRepository } from "../repositories/shopee.repository";
import { UserRepository } from "../repositories/user.repository";
import { ApiResponse } from "../utils/apiResponse";
import { logInfo } from "../utils/logger";
import { ShopeeService } from "./shopee/shopee.service";
import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import { WarehouseRepository } from "../repositories/warehouse.repository";
import { OpnameRepository } from "../repositories/opname.repository";
import { Request } from "express";
export class ApiService {
  private shopeeRepo = new ShopeeRepository();
  private userRepo = new UserRepository();
  private warehouseRepo = new WarehouseRepository();
  private stockopnameRepo = new OpnameRepository();
  private apiShopeeService = new ShopeeService();//Jangan Di hapus dahulu
  async qShopeeInsert(payload: any, userinfo: any) {
    const formattedDate = new Date(payload.fromdate).toISOString().substring(0, 10);
    const orderList = await this.apiShopeeService.getOrderList(formattedDate, payload.fromtime, payload.totime);
    const totalResi = orderList.length;
    logInfo("✅ Sudah di List ", totalResi);
    let arrayOrder = totalResi > 0 ? await this.extractOrderSNList(orderList) : [{}];
    payload.totalresi = totalResi;
    payload.listresi = JSON.stringify(arrayOrder);
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
  async qShopeeInsertCurrent(payload: any, userinfo: any) {
    // const formattedDate = new Date(payload.fromdate).toISOString().substring(0, 10); ///INI KACAU
    // Pecah string tanggal
    const [day, month, year] = payload.fromdate.split('-').map(Number);
    const pad = (n: number) => n.toString().padStart(2, '0');
    // Format manual tanpa UTC shift
    const formattedDate = `${year}-${pad(month)}-${pad(day)}`;
    // const orderList = await this.apiShopeeService.getOrderList(formattedDate, payload.fromtime, payload.totime);
    // const totalResi = orderList.length;
    // logInfo("✅ Sudah di List ", totalResi);
    const packageList = await this.apiShopeeService.getShipmentList(formattedDate, payload.fromtime, payload.totime);
    // const packageLength = packageList.length;
    const totalResi = packageList.length;
    logInfo("✅ package Sudah di List ", totalResi);
    // let arrayOrder:any[] = totalResi > 0 ? await this.extractOrderSNList(orderList) : [{}];
    let arrayOrder:any[] = totalResi > 0 ? await this.extractOrderSNList(packageList) : [{}];
    payload.totalresi = totalResi;
    //######################## GATE PACKAGE DETAIL SIAPA TAU ADA TRACK_NUMBERNYA #################
    let arrayPackagesList:any[] = totalResi > 0 ? await this.extractPackageOrderSNList(packageList) : [{}];

    //####################################################################
    // logInfo("✅ Sudah di List Extract ", payload.totalresi);
    // payload.listresi = JSON.stringify(arrayOrder); SUDAH TIDAK PERLU LAGI
    payload.listresi=JSON.stringify([]);
    const shopeeResult = await this.shopeeRepo.saveQShopee(payload, userinfo);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to insert fetch data!");
    //###################################AMBIL ###################
    // console.log("1. #### HASIL INSERT Q_Shopee ",shopeeResult);
    // console.log("2. #### INPUT HASIL ARRAY ORDER ",arrayOrder);
    console.log("3. #### INPUT KE DALAM INVOICE ");
    const invoiceInsertResult = await this.apiShopeeService.getOrderDetail(arrayOrder)
    if(invoiceInsertResult.length > 0) {
      // console.log("#### SALAH SATU DATA ############################ ",invoiceInsertResult[0]);
      const listResponse = await this.saveShopeeInvoicesCurrent(shopeeResult[0].id, invoiceInsertResult,packageList); //Input Invoices;
      if (!listResponse) {
        return ApiResponse.successNoData(listResponse, "Unable to get data!");
      } else {
        return ApiResponse.success(listResponse, "Records found");
      }
    } else {
      console.log("############################################## ANCUR ############################");
      return ApiResponse.successNoData([], "DESTROY API RESULT!");
    }
    //######################################################################################
  }

   async qShopeeInsertCurrentNew(payload: any, userinfo: any) {
    const id_qshopee= payload.id_q_shopee;

    // const orderList = await this.apiShopeeService.getOrderList(payload.fromdate, payload.fromtime, payload.totime);
    // const totalResi = orderList.length;
    // logInfo("✅ Penarikan Order by tanggal ", orderList.length);
    const packageList = await this.apiShopeeService.getShipmentList(payload.fromdate, payload.fromtime, payload.totime);
    // console.log("HASIL FETCH DATA ORDERS : ",packageList);
    const totalResi = packageList.length;
    logInfo("✅ package Sudah di List ", totalResi);
    // // let arrayOrder:any[] = totalResi > 0 ? await this.extractOrderSNList(orderList) : [{}];
    let arrayOrder:any[] = totalResi > 0 ? await this.extractOrderSNList(packageList) : [{}];
    payload.totalresi = totalResi;
    //################################ GET PACKAGE DETAIL untuk Dapeting tracking Number ######################
    // let arrayPackages:any[] = totalResi > 0 ? await this.extractPackageOrderSNList(packageList) : [{}];
    // const packageDetailList = await this.apiShopeeService.getPackageDetailList(arrayPackages);
    // console.log("HASIL DARI PACKAGE DETAIL ", packageDetailList);
    // const packageDetail = await this.apiShopeeService.getShipmentList(payload.fromdate, payload.fromtime, payload.totime);
    //####################################################################################
    // // logInfo("✅ Sudah di List Extract ", payload.totalresi);
    // // payload.listresi = JSON.stringify(arrayOrder); SUDAH TIDAK PERLU LAGI
    // payload.listresi=JSON.stringify([]);
    // const deleteActiveInvoices = await this.shopeeRepo.saveQShopee(payload, userinfo);

    // delete payload.id_q_shopee;
    const shopeeResult = await this.shopeeRepo.saveQShopee(payload, userinfo);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to insert shopee data!");
    // //###################################AMBIL ###################
    // console.log("1. #### HASIL INSERT Q_Shopee ",shopeeResult);
    // console.log("2. #### INPUT HASIL ARRAY ORDER ",arrayOrder);
    console.log("3. #### INPUT KE DALAM INVOICE ");
    const invoiceInsertResult = await this.apiShopeeService.getOrderDetail(arrayOrder)
    if(invoiceInsertResult.length > 0) {
      // console.log("#### SALAH SATU DATA ############################ ",invoiceInsertResult[0]);
      const listResponse = await this.saveShopeeInvoicesCurrent(shopeeResult[0].id, invoiceInsertResult,packageList); //Input Invoices;
      if (!listResponse) {
        return ApiResponse.successNoData(listResponse, "Unable to insert invoices data!");
      } else {
        return ApiResponse.success(listResponse, "Records found");
      }
    } else {
    //   console.log("############################################## ANCUR ############################");
      return ApiResponse.successNoData([], "DESTROY API RESULT!");
    }
    //######################################################################################
    return ApiResponse.successNoData([], "DESTROY API RESULT!");
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
  async qShopeeChannelList() {
    const shippingParamList = await this.apiShopeeService.getChannelList();
    if (!shippingParamList) return ApiResponse.successNoData(shippingParamList, "Unable to generate channel data!");
    // const listResponse = await this.saveShopeeInvoices(payload.id, invoicesList); //Input Invoices;
      return ApiResponse.success(shippingParamList, "Records found");
  }
  async qShopeeShippingParameter(orders: any[], userinfo: any) {
    const shippingParamList = await this.apiShopeeService.getMassShippingParameter(orders);
    if (!shippingParamList) return ApiResponse.successNoData(shippingParamList, "Unable to generate shipping data!");
    // const listResponse = await this.saveShopeeInvoices(payload.id, invoicesList); //Input Invoices;
      return ApiResponse.success(shippingParamList, "Records found");
  }
  async qShopeeUpdateInvoiceShippingType(orders: any[], userinfo: any) {
    const payloadOrder = await this.tostringArrayPackageOnly(orders);
    const updateResult = await this.shopeeRepo.updQShopeeInvoiceShippingType(payloadOrder);
    // const shippingParamList = await this.apiShopeeService.getMassShippingParameter(orders);
    if (!updateResult) return ApiResponse.successNoData(updateResult, "Unable to update shipping data!");
    return ApiResponse.success(updateResult, "Records updated");

  }
  async qShopeeGet(userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectQShopeeAll();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to insert data!");
    //################## Berhasil Isi #######################
    //  const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
    if (!shopeeResult) {
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    } else {
      return ApiResponse.success(shopeeResult, "Records found");
    }
  }
  async qShopeeGetToday(userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectQShopeeToday();
    if (!shopeeResult) {
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    } else {
      return ApiResponse.success(shopeeResult, "Records found");
    }
  }
  async qShopeeGetAttributes(userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectQShopeeAttributes();
    if (!shopeeResult) {
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    } else {
      return ApiResponse.success(shopeeResult, "Records found");
    }
  }
   async qShopeeUpdateAttributes(payload: any) {
    const shopeeResult = await this.shopeeRepo.updateQShopeeAttributes(payload);
    console.log("HASIL UPDATE ATTRB ", shopeeResult);
    if (!shopeeResult) {
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    } else {
      return ApiResponse.success(shopeeResult, "Records found");
    }
  }
  async qShopeePerformance() {
    const shopeeResult = await this.apiShopeeService.getPerformance();
    if (shopeeResult) {
      return ApiResponse.success(shopeeResult, "Records found");
    }
    return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
  }
  async qShopeeInfo() {
    const shopeeResult = await this.apiShopeeService.getShopInfo();
    if (shopeeResult) {
      return ApiResponse.success(shopeeResult, "Records found");
    }
    return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
  }

  async getAllWarehouses() {
    const shopeeResult = await this.warehouseRepo.findAllWarehouse();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getViewWarehousesById(warehouse_id:string) {
    const shopeeResult = await this.warehouseRepo.findWarehouseById(warehouse_id);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }


 async getAllOpname() {
    const shopeeResult = await this.stockopnameRepo.findAllHeaderOpname();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }

   async insertHeaderOpname(payload:any) {
    console.log("####### insertHeaderOpname : ",payload);
    const shopeeResult = await this.stockopnameRepo.insertOpname(payload);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async insertDetailOpname(payload:any) {
    // console.log("####### insertDetailOpname : ",payload);
    const shopeeResult = await this.stockopnameRepo.insertDetailOpname(payload);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to create data!");
    // const shopeeResult = null;
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }

  async getPackagesAvailable(userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectPackagesAvailable();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getPackagesIstaken(payload: any) {
    const shopeeResult = await this.shopeeRepo.selectPackageIfTaken(payload);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getItemInPackagesAvailable(payload: any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectItemsPackagesAvailable(payload, userinfo);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async updateItemInPackagesAvailable(payload: any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.updateItemsPackagesAvailable(payload, userinfo);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getCountInvoicesAvailable() {
    const shopeeResult = await this.shopeeRepo.getCountInvoicesAvailable();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getCountSKUAvailable() {
    const shopeeResult = await this.shopeeRepo.getCountSKUAvailable();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getAllSKUAvailable() {
    const shopeeResult = await this.shopeeRepo.selectSKUAvailable();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getAllSKUOntTransaction() {
    const shopeeResult = await this.shopeeRepo.selectSKUOnTransaction();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getAllStockOpnameById(payload:any) {
    const shopeeResult = await this.shopeeRepo.selectStockWithSummary(payload);

    // console.log("DATA RESULT GET OPNAME DETAIL ", shopeeResult);

    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
   async getAllStockOpnameByIdExcel(payload:any, req:Request) {
    const shopeeResult = await this.shopeeRepo.selectStockWithSummaryAdj(payload);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    const printResult = await this.apiShopeeService.exportToCSV(shopeeResult);
    console.log("+++++ HASIL CSV : ", printResult);
    //################## Berhasil Isi #######################
    const fileUrl = `${req.protocol}://${req.get('host')}/upload/${printResult}`;





    return ApiResponse.success(fileUrl, "Records found");
  }


  async viewShopeePosByID(payload: any, userinfo: any) {
    // const shopeeResult = await this.shopeeRepo.viewQShopeePosBySN(payload);
    const shopeeResult = await this.shopeeRepo.viewQShopeePosBySN(payload);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    return ApiResponse.success(shopeeResult, "Success get data!");
  }
 async viewShopeePosByIDPrinted(payload: any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.viewQShopeePosBySNPrinted(payload);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    return ApiResponse.success(shopeeResult, "Success get data!");
  }
  async viewShopeePosByIDError(payload: any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.viewQShopeePosBySNError(payload);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    return ApiResponse.success(shopeeResult, "Success get data!");
  }
  async extractOrderSNList(orderList: any[]): Promise<string[]> {
    return orderList.map(item => item.order_sn);
  }
  async extractPackageOrderSNList(orderList: any[]): Promise<string[]> {
    const uniqueOrders = [
      ...new Map(orderList.map(o => [o.package_number, o])).values()
    ];
    return uniqueOrders.map(item => item.package_number);
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
      order_sn: order.order_sn,
      shipping_carrier: order.shipping_carrier
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
          image_url: item.image_info?.image_url || null,
          create_time: this.toDatetimeString(order.create_time)
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
   async saveShopeeInvoicesCurrent(id: number, orderDetails: any[], packageList:any[]) {
    // 1. Persiapan data untuk table q_shopee_invoices
    const packageMap = Object.fromEntries(
      packageList.map(p => [p.order_sn, p.package_number])
    );

    const invoices = orderDetails.map((order) => ({
      id_q_shopee: id,
      create_time: this.toDatetimeString(order.create_time),
      order_status: order.order_status,
      total_amount: order.total_amount,
      ship_by_date: this.toDatetimeString(order.ship_by_date),
      status: 0,
      order_sn: order.order_sn,
      shipping_carrier: order.shipping_carrier,
      package_number: packageMap[order.order_sn] ?? null // aman kalau tidak ada
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
          image_url: item.image_info?.image_url || null,
          create_time: this.toDatetimeString(order.create_time)
        });
      });
    });
    // 3. Insert ke kedua tabel
    // 3.1 Delete jika ada invoice yang ada pada invoices
    const listInvoces = await this.extractOrderSNList(invoices);
    const hasilDeleteInvoice = await this.shopeeRepo.deleteQShopeeInvoices(listInvoces);
    console.log("HASIL DELETE INVOICE : ", hasilDeleteInvoice);
    const hasilDeleteInvoiceDetail = await this.shopeeRepo.deleteQShopeeInvoicesDetail(listInvoces);
    console.log("HASIL DELETE INVOICE DETAIL : ", hasilDeleteInvoiceDetail);


    // 3.2 Delete detail invoice jika ada
    //#####################################################
    const invoicesResult = await this.shopeeRepo.saveQShopeeInvoices(invoices);
    const detailsResult = await this.shopeeRepo.saveQShopeeInvoicesDetail(invoiceDetails); // <- tambahkan fungsi ini
    const updateQShopee = await this.shopeeRepo.updateQShopee({ id: id });
    // 4. Ambil semua data untuk dikembalikan
    const rowQueryShopee = await this.shopeeRepo.selectQShopeeToday();
    if (!rowQueryShopee) {
      return ApiResponse.successNoData(null, "Unable to get data!");
    } else {
      return ApiResponse.success(rowQueryShopee, "Records found");
    }
  }
  // async getBestShopeeItems(item_id: string, model_id:string, shipping_carrier:string) {
  //   // 1. Persiapan data untuk table q_shopee_invoices
  //   console.log("############# MASUK getBestShopeeItems");
  //   // 3. Insert ke kedua tabel
  //   const invoicesResult = await this.shopeeRepo.getQShopeeItembest(item_id, model_id, shipping_carrier);
  //   if (!invoicesResult) {
  //     return ApiResponse.successNoData(null, "Unable to get data!");
  //   } else {
  //     return ApiResponse.success(invoicesResult, "Records found");
  //   }
  // }
  async getBestShopeeItems(payload:any[]):Promise<any> {
    // 1. Persiapan data untuk table q_shopee_invoices
    console.log("############# MASUK getBestShopeeItems");
    // 3. Insert ke kedua tabel
    const invoicesResult:any = await this.shopeeRepo.getQShopeeItembestMulti(payload);

    if (!invoicesResult) {
      return ApiResponse.successNoData(null, "Unable to get data!");
    } else {
      return ApiResponse.success(invoicesResult, "Records found");
    }
  }


  async sendEmailNotification(to: string, subject: string, message: string) {
    // console.log('sendEmailNotification called with:', { to, subject, message });
    const smtpVariable = await this.shopeeRepo.getSMTPVariables();
    logInfo("SMTP OBJECT ", smtpVariable);
    // {"smtp":"smtp.gmail.com","usermail":"aryaadityawijaya@gmail.com","password":"vyenzhnzitzlqbbb","service":"gmail","secret":"https://myaccount.google.com/apppasswords","refreshtoken":"https://myaccount.google.com/apppasswords","accesstoken":"https://myaccount.google.com/apppasswords","port":465}
    const transporter = nodemailer.createTransport({
      service: smtpVariable.service,
      auth: {
        user: smtpVariable.usermail,        // Ganti dengan email Gmail kamu
        pass: smtpVariable.password,           // Ganti dengan App Password Gmail (16 karakter)
      },
    });
    const mailOptions = {
      from: `"Jawara Pattimura" <${smtpVariable.usermail}>`, // Ganti sesuai branding dan email kamu
      to: to,
      subject: subject,
      html: message,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      logInfo("📤 Email terkirim: ", info.messageId);
      return ApiResponse.success({ messageId: info.messageId }, "Email sent successfully");
    } catch (error) {
      logInfo("❌ Gagal kirim email:", error);
      return ApiResponse.successNoData({}, "Failed to send email");
    }
  }
  async registerUser(payload: any) {
    const userResult = await this.userRepo.registerUser(payload);

    if (!userResult) {
      return ApiResponse.successNoData(null, "Unable to insert data!");
    } else {
      return ApiResponse.success(userResult, "Success insert");
    }
  }

  async updateUser(payload: any, userInfo: any) {
    const userResult = await this.userRepo.updateUser(payload, userInfo);
    if (!userResult) {
      return ApiResponse.successNoData(null, "Unable to update data!");
    } else {
      return ApiResponse.success(userResult, "Success update");
    }
  }

   async sendPrinting(orders: any, addressObj:any, timeSlot:any) {
    // console.log("Sending Printing Orders ",orders);
    const hasilprint = await this.apiShopeeService.checkAndStraightLabelNew(orders, addressObj,timeSlot);
    console.log("Hasil Download ", hasilprint);
    if(hasilprint.code !== 20000) {
      return ApiResponse.successNoData(hasilprint, "Error on printing!");
    }
    if(hasilprint.message === 'No shipped orders found') {
      console.log("Order yang di delete 1 : ", hasilprint.data.failedOrders);
      // 🧩 Merge berdasarkan package_number
      const mergedDelete = hasilprint.data.failedOrders.map((f: { package_number: any; }) => {
        const found = orders.find((o: { package_number: any; }) => o.package_number === f.package_number);
        return found ? { ...f, order_sn: found.order_sn } : f;
      });
       const ordersToDelete = await this.tostringArrayOnly(mergedDelete);
      const labelPrinted = "";
      console.log("Order yang di delete 3 : ", ordersToDelete);
      const selectInvoiceUpdate = await this.shopeeRepo.copyInvoiceToBulkData(ordersToDelete, labelPrinted);
      return ApiResponse.success(hasilprint, hasilprint.data.failedOrders[0]);
    }
    console.log("**** ORDER BALIKAN ",hasilprint.data.downloadResult.orders);
    const ordersToDelete = await this.tostringArrayOnly(hasilprint.data.downloadResult.orders);
    const labelPrinted = hasilprint.data.downloadResult.fileUrl;

    console.log("Order yang di delete : ", ordersToDelete);
    const selectInvoiceUpdate = await this.shopeeRepo.copyInvoiceToBulkData(ordersToDelete, labelPrinted);
    return ApiResponse.success(hasilprint, "Printing sent successfully");
  }

   async sendPrintingCounter(orders: any, dropOffObj:any) {
    // console.log("Sending Printing Orders ",orders);
    const hasilprint = await this.apiShopeeService.checkAndStraightLabelCounter(orders, dropOffObj);
    console.log("Hasil Download ", hasilprint);
    if(hasilprint.code !== 20000) {
      return ApiResponse.successNoData(hasilprint, "Error on printing!");
    }
    if(hasilprint.message === 'No shipped orders found') {
      console.log("Order yang di delete counter 1 : ", hasilprint.data.failedOrders);
      // 🧩 Merge berdasarkan package_number
      const mergedDelete = hasilprint.data.failedOrders.map((f: { package_number: any; }) => {
        const found = orders.find((o: { package_number: any; }) => o.package_number === f.package_number);
        return found ? { ...f, order_sn: found.order_sn } : f;
      });
       const ordersToDelete = await this.tostringArrayOnly(mergedDelete);
      const labelPrinted = "";
      console.log("Order yang di delete counter 3 : ", ordersToDelete);
      const selectInvoiceUpdate = await this.shopeeRepo.copyInvoiceToBulkData(ordersToDelete, labelPrinted);
      return ApiResponse.success(hasilprint, hasilprint.data.failedOrders[0]);
    }
    console.log("**** ORDER BALIKAN ",hasilprint.data.downloadResult.orders);
    const ordersToDelete = await this.tostringArrayOnly(hasilprint.data.downloadResult.orders);
    const labelPrinted = hasilprint.data.downloadResult.fileUrl;

    console.log("Order yang di delete : ", ordersToDelete);
    const selectInvoiceUpdate = await this.shopeeRepo.copyInvoiceToBulkData(ordersToDelete, labelPrinted);
    return ApiResponse.success(hasilprint, "Printing sent successfully");
  }

  private toDatetimeString(unix: number): string {
    const date = new Date(unix * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  async tostringArrayOnly(data: any[]): Promise<string[]> {
    const result: string[] = [];
    for (const item of data) {
      await new Promise(resolve => setTimeout(resolve, 10)); // contoh delay kalau perlu
      result.push(item.order_sn);
    }
    return result;
  }
  async tostringArrayPackageOnly(data: any[]): Promise<string[]> {
    const result: string[] = [];
    for (const item of data) {
      await new Promise(resolve => setTimeout(resolve, 10)); // contoh delay kalau perlu
      result.push(item.package_number);
    }
    return result;
  }
}


