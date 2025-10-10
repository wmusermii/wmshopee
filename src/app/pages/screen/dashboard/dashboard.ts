import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatetimeComponent } from "../../../layouts/directive/datetime/datetime.component";
//######################### PRIMENG ##############################
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ChipModule } from 'primeng/chip';

import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { TableModule } from 'primeng/table';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroupModule } from 'primeng/inputgroup';
import { TabsModule } from 'primeng/tabs';
@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule, DatetimeComponent, TableModule, InputGroupModule, InputTextModule, InputGroupAddonModule, TabsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  ordersPrint: any[] = []
  loadingUser = true;
  showGenerateDialog: boolean = false;
  showProcessResiDialog: boolean = false;
  showProcedPostDialog: boolean = false;
  QueriesDataPos: QueryFields[] = [];
  AllQueriesDataPos: QueryFields[] = [];
  QueriesDataPrinted: QueryFieldsPrinted[] = [];
  AllQueriesDataPrinted: QueryFieldsPrinted[] = [];
  // selectProduct: QueryFields = {
  //   item_id: '',
  //   item_name: '',
  //   model_id: '',
  //   model_name: '',
  //   image_url: '',
  //   shipping_carrier: '',
  //   invoices: 0,
  //   qty: 0
  // };
   selectProduct: QueryFields[] = [];
  selectProductPrinted: QueryFieldsPrinted = {
    item_id: '',
    item_name: '',
    model_id: '',
    model_name: '',
    image_url: '',
    shipping_carrier: '',
    invoices: 0,
    qty: 0,
    labelshopee:''
  };


  globalFilter: string = '';
  globalFilterPrinted: string = '';
  token: string | null | undefined = undefined;
  userInfo: any | undefined;
  date: Date | undefined = new Date(); // contoh
  disableBtn: boolean = true;
  currentDate: string | undefined;
  starttime: string | undefined = ""
  endtime: string | undefined = ""

  startDateFetch:Date| undefined = new Date
  endDateFetch:Date| undefined = new Date

  value: string | undefined;
  loading: boolean = true;
  totalSku: string = "0";
  totalStoreItem: string = "0";
  totalWarehouseItem: string = "0";
  totalResi: number = 0
  itemList: any[] = [];
  dataResi: any[] = [];
  groupName: string | undefined = undefined
  skutotal: string = "Sku : 0 items";
  // storeitemtotal: string = "In Store : 1500 pcs.";
  // whitemtotal: string = "In Warehouse : 500 pcs.";
  invoicetotal: number = 0;
  invoicetotalStr: string = "Invoices : 0 pcs.";
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  async ngOnInit(): Promise<void> {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    const sessionDate: any = this.ssrStorage.getItem("FETCHTIME")
    console.log("USER INFO ", this.userInfo);
    // this._refreshCountInvoices();
    this._refreshCountSKU();
    if (this.date && !sessionDate) {
      this.currentDate = this.date.toLocaleDateString('en-GB'); // format dd/mm/yyyy
      // Kalau mau jadi 11-08-2025
      this.currentDate = this.currentDate.replace(/\//g, '-');
      // Jam:Menit:Detik
      this.endtime = this.date.toLocaleTimeString('en-GB'); // format HH:MM:SS
    } else {
      const arrayDate: string = sessionDate.split(",");
      this.currentDate = this.date?.toLocaleDateString('en-GB'); // format dd/mm/yyyy
      this.currentDate = this.currentDate?.replace(/\//g, '-');
      if (this.currentDate === arrayDate[2]) this.currentDate = arrayDate[2];
    }
    // await this.qz.connect();
    this._lastFetchShopee();
  }
  async _refreshCountInvoices() {
    this.loading = true;
    fetch('/v2/warehouse/get_resi_count', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /warehouse/get_resi_count", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /warehouse/get_resi_count", data);
        if (data.code === 20000) {
          this.totalResi = data.data.invoiceQty;
          this.invoicetotalStr = `Invoices : ${this.totalResi} pcs.`
          // const dataRecordsTemp = cloneDeep(data.data);;
          // this.totalSku = dataRecordsTemp; this.loading = false;

        } else {
          // this.listInvoices = [];
          this.totalResi = 0;
          this.invoicetotalStr = `Invoices : ${this.totalResi} pcs.`
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_resi_count", err);
      });
  }
  async _refreshCountSKU() {
    this.loading = true;
    fetch('/v2/warehouse/get_sku_count', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        // console.log("Response dari API  /warehouse/get_sku_count", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(data => {
        // console.log("Response dari API /warehouse/get_sku_count", data);
        if (data.code === 20000) {
          // this.listInvoices = [];
          this.totalSku = data.data.skuQty;
          this.skutotal = `Sku : ${this.totalSku} items`
          this.loadingUser = false;
        } else {
          // this.listInvoices = [];
          this.totalSku = "0";
          this.skutotal = `Sku : ${this.totalSku} items`
          this.loadingUser = false;
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_sku_count", err);
      });
  }
  async _lastFetchShopee() {
    this.loading = true;
    fetch('/v2/shopee/get_qshopeetoday', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /v2/shopee/get_qshopeetoday", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /v2/shopee/get_qshopeetoday", data);
        if (data.code === 20000) {
          this.loading = false;
          this.starttime = data.data.totime;
          this.endtime = data.data.totime;
          this.ssrStorage.setItem("FETCHTIME", `${this.starttime},${this.endtime},${this.currentDate}`);
          this.disableBtn = false;
          this.totalResi = data.data.totalresi;
          this.invoicetotalStr = `Invoices : ${this.totalResi} pcs.`
          await this._getViewPosProcess({ id: data.data.id });
          await this._getViewPrintedProcess({ id: data.data.id });
        } else {
          this.loading = false;
          this.disableBtn = false;
          this.QueriesDataPos = [];
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_sku_count", err);
      });
  }

  async _popupShopee() {
    this.showGenerateDialog = true;
    // let startArray: any = await this.ssrStorage.getItem("FETCHTIME");
    // if (startArray) {
    //   //################### SETTING JAM BERIKUT ########################
    //   let startT: string[] = startArray.split(",");
    //   this.starttime = startT[0];
    //   let dateTmp = new Date();
    //   this.endtime = dateTmp.toLocaleTimeString('en-GB');
    // }
   this.starttime = this.startDateFetch?.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  });
   this.endtime = this.endDateFetch?.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  });

  }
  async _processFetchingShopee() {
    this.loading = true;
    this.showGenerateDialog = false;
    //################## AMBIL DATA DULU DARI LOCAL SESSION #######################
    // let startArray: any = await this.ssrStorage.getItem("FETCHTIME");
    // if (startArray) {
    //   //################### SETTING JAM BERIKUT ########################
    //   let startT: string[] = startArray.split(",");
    //   this.starttime = startT[0];
    //   let dateTmp = new Date();
    //   // Jam:Menit:Detik
    //   this.endtime = dateTmp.toLocaleTimeString('en-GB');
    // }
    //#############################################################################
    let payload = { date: this.currentDate, fromtime: this.starttime, totime: this.endtime }

    console.log("Payload yang dikirim ", payload);
    fetch('/v2/shopee/gen_qshopeeCurrent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API /shopee/gen_qshopeeCurrent 0", res);
        if (!res.ok) throw new Error('q_shopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/gen_qshopeeCurrent 1", data);
        if (data.code === 20000) {
          // const dataRecords = data.data;
          // const dataRecordsTemp = cloneDeep(data.data);
          console.log("FETCH SETELAH GENERATE ");
          this._lastFetchShopee();
          this.loading = false;
        } else {
          this.loading = false
          // this.listMenu = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/gen_qshopeeCurrent", err);
      });
  }
  async _cancelFetchingShopee() {
    this.showGenerateDialog = false;
  }
  _goToPackaging() {
    this.router.navigate(['/printing']);
  }

  async _langsungPrint() {
    // this.router.navigate(['/printing']);
    this.loading = true;
    await this._refreshListPrint(this.selectProduct);
  }


  async _getViewPosProcess(payload: any) {
    this.loading = true;
    fetch('/v2/shopee/get_positem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API  /shopee/get_positem", res);
        if (!res.ok) throw new Error('get QShopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/get_positem ", data);
        this.loading = false;
        if (data.code === 20000) {
          this.showProcedPostDialog = true;
          const dataRecordsTemp = cloneDeep(data.data);
          dataRecordsTemp.data = dataRecordsTemp.data.map((row: any) => ({
            ...row,
            uniqueKey: `${row.item_id}${row.model_id}${row.shipping_carrier}`,
          }));
          // console.log("Data View ", dataRecordsTemp.data);
          this.QueriesDataPos = dataRecordsTemp.data;
          this.AllQueriesDataPos = dataRecordsTemp.data;
          this.loading = false;
        } else {
          this.QueriesDataPos = [];
          this.AllQueriesDataPos = [];
          this.loading = false;
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/get_positem", err);
      });
  }
  async _getViewPrintedProcess(payload: any) {
    this.loading = true;
    fetch('/v2/shopee/get_positemprinted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API  /shopee/get_positemprinted", res);
        if (!res.ok) throw new Error('get QShopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/get_positemprinted ", data);
        this.loading = false;
        if (data.code === 20000) {
          // this.showProcedPostDialog = true;
          const dataRecordsTemp = cloneDeep(data.data);
          console.log("Data View printed : ", dataRecordsTemp.data);
          this.QueriesDataPrinted = dataRecordsTemp.data;
          this.AllQueriesDataPrinted = dataRecordsTemp.data;
          // this.loading=false;
        } else {
          this.QueriesDataPrinted = [];
          this.AllQueriesDataPrinted = [];
          this.loading = false;
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/get_positemprinted", err);
      });
  }




  async _onRowSelect() {
    // console.log("Selected 1 : ", payload);
    console.log("Selected 2 : ", this.selectProduct);
    // {
    //     "item_id": "23562550180.0",
    //     "item_name": "SERTIFIKAT TKU PENGGALANG Ramu Rakit Terap",
    //     "model_id": "157139562077.0",
    //     "model_name": "Ramu SERTIFIKAT",
    //     "image_url": "https://cf.shopee.co.id/file/id-11134207-7rbk1-m8ltzb32r85n72_tn",
    //     "shipping_carrier": "SPX Hemat",
    //     "invoices": 2,
    //     "qty": 51
    // }
    this.ssrStorage.setItem("FORCEITEMID", this.selectProduct);
    this._langsungPrint();
  }
  async _onMassPrint() {

  }
  async _onRowSelectPrinted(payload: any) {
    // console.log("Selected print 1 : ", payload);
    // console.log("Selected print 2 : ", this.selectProductPrinted);
    const fileUrl = this.selectProductPrinted.labelshopee+`?t=${Date.now()}`
    // const url = `${window.location.origin}/upload/${data.data.data.fileName}?t=${Date.now()}`; // anti-cache
          setTimeout(() => {
            const printWindow = window.open(fileUrl, '_blank');
            if (printWindow) {
              printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                setTimeout(() => {
                  printWindow.close(); // coba tutup tab setelah delay
                }, 5000);
              };
            } else {
              alert("Gagal membuka tab baru. Pastikan popup tidak diblokir browser.");
            }
          }, 100);

  }



  onGlobalSearch() {
    console.log("Global filter : ", this.globalFilter);
    const term = this.globalFilter.trim().toLowerCase();
    if (term === '') {
      this.QueriesDataPos = [...this.AllQueriesDataPos];
    } else {
      this.QueriesDataPos = this.AllQueriesDataPos.filter(item =>
        [item.item_name, item.model_name, item.shipping_carrier]
          .some(field => field?.toLowerCase().includes(term))
      );
    }
  }
  onGlobalSearchPrinted() {
    console.log("Global filter Printed : ", this.globalFilterPrinted);
    const term = this.globalFilterPrinted.trim().toLowerCase();
    if (term === '') {
      this.QueriesDataPrinted = [...this.AllQueriesDataPrinted];
    } else {
      this.QueriesDataPrinted = this.AllQueriesDataPrinted.filter(item =>
        [item.item_name, item.model_name, item.shipping_carrier]
          .some(field => field?.toLowerCase().includes(term))
      );
    }
  }
  async _manualSearch() {

  }
  async _refreshListPrint(payload:any[]): Promise<void> {
    // const payload = { item_id: this.selectProduct.item_id, model_id: this.selectProduct.model_id, shipping_carrier: this.selectProduct.shipping_carrier }
    const payloadSend = {itemArray:payload}
    fetch('/v2/shopee/get_data_print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payloadSend)
    })
      .then(res => {
        console.log("Response dari API /shopee/get_data_print 0", res);
        if (!res.ok) throw new Error('q_shopee Gagal');
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /shopee/get_data_print 1", data);
        if (data.code === 20000) {
          const dataRecordsTemp: any[] = cloneDeep(data.data);
          // console.log("INVOICE YANG DI PRINT : ", dataRecordsTemp);
          this.ordersPrint = Object.values(dataRecordsTemp.reduce((acc, item) => {
            if (!acc[item.order_sn]) {
              acc[item.order_sn] = {
                order_sn: item.order_sn,
                package_number: item.package_number
              };
            }
            return acc;
          }, {} as Record<string, { order_sn: string, package_number: string }>)
          );

          await this._goPrinting();

        } else {
          this.ordersPrint = []
          this.loading = false;
        }
      })
      .catch(err => {
        this.loading = false;
        // this.orders=[];
        // this.invoicetotal = this.orders.length
        // this.invoicetotalStr =`Invoices : ${this.invoicetotal} pcs.`
        console.log("Response Error Catch /shopee/get_data_print", err);
      });
  }
  async _goPrinting() {
    // console.log("Payload 1 ", this.ordersPrint);
    const payload = { orders: this.ordersPrint }
    // console.log("Payload 2 ", payload);
    fetch('/v2/shopee/send_print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API /shopee/send_print 0", res);
        if (!res.ok) throw new Error('q_shopee Gagal');
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /shopee/send_print 1", data);
        // this.loading=false;
        if (data.code === 20000) {
          const fileNameURL = data.data.data.fileUrl;
          console.log("File yang di download ", fileNameURL);
          // window.open(fileNameURL, '_blank');
          const url = `${window.location.origin}/upload/${data.data.data.fileName}?t=${Date.now()}`; // anti-cache
          console.log("Menggunakan Origin : ", url);
          const urlLangsung = fileNameURL+`?t=${Date.now()}`;
          console.log("Menggunakan Langsung : ", urlLangsung);
          setTimeout(() => {
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
              printWindow.onload = () => {
                console.log("Coba print");
                printWindow.focus();
                printWindow.print();
                // setTimeout(() => {
                //   printWindow.close(); // coba tutup tab setelah delay
                // }, 5000);
              };
            } else {
              alert("Gagal membuka tab baru. Pastikan popup tidak diblokir browser.");
            }
          }, 50); // kasih jeda biar file ready
        }
        // this.loading=true;
        // this.router.navigate(['/dashboard']);
        this._lastFetchShopee();
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /shopee/send_print", err);
      });
  }

}


interface QueryFields {
  id_q_shopee?:string,
  item_id?: string;
  item_name?: string;
  model_id?: string;
  model_name?: string;
  image_url?: string;
  shipping_carrier?: string;
  invoices?: number;
  qty?: number;
}
interface QueryFieldsPrinted {
  item_id?: string;
  item_name?: string;
  model_id?: string;
  model_name?: string;
  image_url?: string;
  shipping_carrier?: string;
  invoices?: number;
  qty?: number;
  labelshopee?: string
}
interface Column {
  field: string;
  header: string;
  class: string;
  cellclass: string;
}
