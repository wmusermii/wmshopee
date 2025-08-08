// import { UserRepository } from "../repositories/user.repository";
// import { ApiResponse } from "../utils/apiResponse";
import { ShopeeRepository } from "../repositories/shopee.repository";
import { UserRepository } from "../repositories/user.repository";
import { ApiResponse } from "../utils/apiResponse";
import { logInfo } from "../utils/logger";
import { ShopeeService } from "./shopee/shopee.service";
import nodemailer from 'nodemailer';
export class ApiService {
  private shopeeRepo = new ShopeeRepository();
  private userRepo = new UserRepository();
  private apiShopeeService = new ShopeeService();//Jangan Di hapus dahulu
  async qShopeeInsert(payload: any, userinfo: any) {
    const formattedDate = new Date(payload.fromdate).toISOString().substring(0, 10);
    const orderList = await this.apiShopeeService.getOrderList(formattedDate, payload.fromtime, payload.totime);
    const totalResi = orderList.length;
    logInfo("✅ Sudah di List ", totalResi);
    let arrayOrder = totalResi > 0 ? await this.extractOrderSNList(orderList) : [{}];
    payload.totalresi = totalResi; payload.listresi = JSON.stringify(arrayOrder);
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
  async qShopeeGet(userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectQShopeeAll();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to insert data!");
    //################## Berhasil Isi #######################
     const rowQueryShopee = await this.shopeeRepo.selectQShopeeAll();
    if (!rowQueryShopee) {
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    } else {
      return ApiResponse.success(rowQueryShopee, "Records found");
    }
  }
  async qShopeePerformance() {
    const shopeeResult = await this.apiShopeeService.getPerformance();
    if(shopeeResult) {
      return ApiResponse.success(shopeeResult, "Records found");
    }
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
  }
   async qShopeeInfo() {
    const shopeeResult = await this.apiShopeeService.getShopInfo();
    if(shopeeResult) {
      return ApiResponse.success(shopeeResult, "Records found");
    }
      return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
  }
  async getPackagesAvailable(userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectPackagesAvailable();
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
   async getPackagesIstaken(payload:any) {
    const shopeeResult = await this.shopeeRepo.selectPackageIfTaken(payload);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getItemInPackagesAvailable(payload:any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.selectItemsPackagesAvailable(payload, userinfo);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async updateItemInPackagesAvailable(payload:any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.updateItemsPackagesAvailable(payload, userinfo);
    if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getCountInvoicesAvailable(){
    const shopeeResult = await this.shopeeRepo.getCountInvoicesAvailable();
     if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getCountSKUAvailable(){
    const shopeeResult = await this.shopeeRepo.getCountSKUAvailable();
     if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async getAllSKUAvailable(){
    const shopeeResult = await this.shopeeRepo.selectSKUAvailable();
     if (!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    //################## Berhasil Isi #######################
    return ApiResponse.success(shopeeResult, "Records found");
  }
  async viewShopeePosByID(payload:any, userinfo: any) {
    const shopeeResult = await this.shopeeRepo.viewQShopeePosBySN(payload);
    if(!shopeeResult) return ApiResponse.successNoData(shopeeResult, "Unable to get data!");
    return ApiResponse.success(shopeeResult, "Success get data!");
  }
  async extractOrderSNList(orderList: any[]): Promise<string[]> {
    return orderList.map(item => item.order_sn);
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
      shipping_carrier:order.shipping_carrier
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
          create_time:this.toDatetimeString(order.create_time)
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
  async registerUser(payload:any) {
    const userResult = await this.userRepo.registerUser(payload);

    if (!userResult) {
      return ApiResponse.successNoData(null, "Unable to insert data!");
    } else {
      return ApiResponse.success(userResult, "Success insert");
    }
  }

async updateUser(payload:any, userInfo:any) {
    const userResult = await this.userRepo.updateUser(payload, userInfo);
    if (!userResult) {
      return ApiResponse.successNoData(null, "Unable to update data!");
    } else {
      return ApiResponse.success(userResult, "Success update");
    }
  }
async sendPrinting(order_sn:any, userInfo:any) {
  const printingObject:any[] = await this.shopeeRepo.selectItemsToPrint({order_sn:order_sn}, userInfo);
  logInfo("hasil select ")




  return ApiResponse.success(printingObject, "Printing sent successfully");
}



  private toDatetimeString(unix: number): string {
    const date = new Date(unix * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

}

