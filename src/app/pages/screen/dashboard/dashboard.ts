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
import { SelectModule } from 'primeng/select';
@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule, DatetimeComponent, TableModule, InputGroupModule, InputTextModule, InputGroupAddonModule, TabsModule,SelectModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  ordersPrint: any[] = []
  loadingUser = true;
  showGenerateDialog: boolean = false;
  showProcessResiDialog: boolean = false;
  showProcedPostDialog: boolean = false;
  showErrorPopup:any = {show:false, severity:"error", message:"Message"}
  arraySPXType:any[]=[{code:"SPX Sameday", label:"SPX Sameday"},{code:"SPX Hemat", label:"SPX Hemat"}];
  selectSPXType:any = {};
  pickupAdrress:any | undefined = null;
  timeSlotList:any[]=[];
  selectedSlotTime:any |undefined = null;
  pickupObject:any |undefined = {address:"",city:"",district:""}
  QueriesDataPos: QueryFields[] = [];
  AllQueriesDataPos: QueryFields[] = [];
  QueriesDataPrinted: QueryFieldsPrinted[] = [];
  AllQueriesDataPrinted: QueryFieldsPrinted[] = [];

  QueriesDataError: QueryFieldsPrinted[] = [];
  AllQueriesDataError: QueryFieldsPrinted[] = [];
  QueriesPrintedSummary: QueryFieldsSummary[] = [];
  AllQueriesPrintedSummary: QueryFieldsSummary[] = [];
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
  selectProductError: QueryFieldsPrinted = {
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
  globalFilterError: string = '';
  token: string | null | undefined = undefined;
  userInfo: any | undefined;
  date: Date | undefined = new Date(); // contoh
  disableBtn: boolean = true;
  currentDate: string | undefined;
  starttime: string | undefined = ""
  endtime: string | undefined = ""
  idQShopee:number | undefined = 0;
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
  invoiceprinted: number = 0;
  invoicetotalprintedStr: string = "Printed : 0 pcs.";
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  async ngOnInit(): Promise<void> {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    const sessionDate: any = this.ssrStorage.getItem("FETCHTIME")
    console.log("USER INFO ", this.userInfo);
    // this._refreshCountInvoices();
    this._refreshCountSKU();
    // this._getChannelList();
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
  async _getChannelList(){
    this.loading = true;
    fetch('/v2/shopee/get_channelslist', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /v2/shopee/get_channelslist", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /v2/shopee/get_channelslist", data);
        if (data.code === 20000) {

        } else {

        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /v2/shopee/get_channelslist", err);
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
          this.idQShopee = data.data.id;
          this.starttime = data.data.totime;
          this.endtime = data.data.totime;
          this.ssrStorage.setItem("FETCHTIME", `${this.starttime},${this.endtime},${this.currentDate}`);
          this.disableBtn = false;
          this.totalResi = data.data.totalresi;
          this.invoicetotalStr = `Invoices : ${this.totalResi} pcs.`
          await this._getViewPosProcess({ id: data.data.id });
          await this._getViewPrintedProcess({ id: data.data.id });
          await this._getViewPrintedError({ id: data.data.id });
          await this._getViewPrintedSummary({ id: data.data.id });
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
    let payload = { date: this.currentDate, fromtime: this.starttime, totime: this.endtime, id_q_shopee:this.idQShopee }
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
   async _langsungPrintCounterMassal() {
    // this.router.navigate(['/printing']);
    this.loading = true;
    await this._refreshListPrintCounter(this.selectProduct);
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
      .then(async data => {
        console.log("Response dari API /shopee/get_positem ", data);
        this.loading = false;
        if (data.code === 20000) {
          this.showProcedPostDialog = true;
          const dataRecordsTemp = cloneDeep(data.data);
          dataRecordsTemp.data = dataRecordsTemp.data.map((row: any) => ({
            ...row,
            uniqueKey: `${row.order_sn}`,
          }));
          //  uniqueKey: `${row.item_id}${row.model_id}${row.shipping_carrier}${row.package_number}`,
          // hasil distinct map
          const carriers = [...new Set(dataRecordsTemp.data.map((d: { shipping_carrier: any; }) => d.shipping_carrier))].map(c => ({code: c, label: c}));
          this.QueriesDataPos = dataRecordsTemp.data;
          this.AllQueriesDataPos = dataRecordsTemp.data;
          this.loading = false;
          this.arraySPXType = carriers;
          // await this._getMassShippingParameter(dataRecordsTemp.data);
          this.onGlobalSearch()
        } else {
          this.QueriesDataPos = [];
          this.AllQueriesDataPos = [];
          this.loading = false;
          this.arraySPXType = [];
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
  async _getViewPrintedError(payload: any) {
    this.loading = true;
    fetch('/v2/shopee/get_positemerror', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API  /shopee/get_positemerror", res);
        if (!res.ok) throw new Error('get QShopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/get_positemerror ", data);
        this.loading = false;
        if (data.code === 20000) {
          // this.showProcedPostDialog = true;
          const dataRecordsTemp = cloneDeep(data.data);
          // console.log("Data View error : ", dataRecordsTemp.data);
          this.QueriesDataError = dataRecordsTemp.data;
          this.AllQueriesDataError = dataRecordsTemp.data;

          // this.loading=false;
        } else {
          this.QueriesDataError = [];
          this.AllQueriesDataError = [];
          this.loading = false;
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/get_positemerror", err);
      });
  }

  async _getViewPrintedSummary(payload: any) {
    this.loading = true;
    fetch('/v2/shopee/get_summaryprinted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API  /shopee/get_summaryprinted", res);
        if (!res.ok) throw new Error('get QShopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/get_summaryprinted ", data);
        this.loading = false;
        if (data.code === 20000) {
            const dataRecordsTemp = cloneDeep(data.data);
           console.log("Data View Summary : ", dataRecordsTemp.data);
          this.QueriesPrintedSummary = dataRecordsTemp.data;
          this.AllQueriesPrintedSummary = dataRecordsTemp.data;
        } else {
          this.QueriesPrintedSummary = [];
          this.AllQueriesPrintedSummary = [];
          this.loading = false;
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/get_summaryprinted", err);
      });
  }



  async _getMassShippingParameter(payload: any[]) {
  try {
    this.loading = true;

    // Hapus duplikat berdasarkan package_number
    const uniqueData = Array.from(
      new Map(payload.map(item => [item.package_number, item])).values()
    );

    // Bagi data ke dalam batch berisi maksimal 50 item
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < uniqueData.length; i += batchSize) {
      batches.push(uniqueData.slice(i, i + batchSize));
    }

    console.log(`Mengirim ${batches.length} batch (max ${batchSize} per batch)`);
    // console.log(`Mengirim ***** : ${JSON.stringify(batches)}`);
    // Jalankan semua batch paralel
    const results = await Promise.all(
      batches.map(async (batch, index) => {
        const res = await fetch('/v2/shopee/get_massshippingparam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify(batch)
        });
        if (!res.ok) throw new Error(`Batch ${index + 1} gagal`);
        return res.json();
      })
    );


    // Gabungkan semua hasil
    const mergedPickupAddresses: any[] = [];
    const mergedDropoff: any[] = [];
    const successList: any[] = [];
    const failList: any[] = [];

    for (const result of results) {
      if (result.code === 20000 && result.data) {
        const dataReturnTemp = result.data;
        mergedPickupAddresses.push(...(dataReturnTemp.pickup_address || []));
        mergedDropoff.push(...(dataReturnTemp.dropoff_param || []));
        successList.push(...(dataReturnTemp.shipping_Param || []));
        failList.push(...(dataReturnTemp.noshipping_Param || []));
      }
    }

    // console.log("SEMUA PICKUP ADDRESS:", mergedPickupAddresses);
    console.log("DROP OFF LIST:", mergedDropoff);
    console.log("SUCCESS:", successList.length, "FAIL:", failList.length);

    // Pilih pickup address utama
    if (mergedPickupAddresses.length > 0) {
      this.pickupAdrress = mergedPickupAddresses.find(addr =>
        addr.address_flag && addr.address_flag.includes("pickup_address")
      ) || mergedPickupAddresses[0];
      this.pickupObject = cloneDeep(this.pickupAdrress);
      console.log("TIME SLOT ",
        this.pickupAdrress.time_slot_list
      );
      // Format waktu slot pickup
      const timeSlotListTemp = this.pickupAdrress.time_slot_list || [];

this.timeSlotList = timeSlotListTemp.map((slot: any) => {
  const date = new Date(Number(slot.date) * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('id-ID', { month: 'short' }); // contoh: "Nov"
        // Default gunakan time_text dari API
        let timeRange = slot.time_text;
        // Jika tidak ada time_text, buat sendiri berdasarkan pickup_time_id
        if (!timeRange && slot.pickup_time_id) {
          const match = slot.pickup_time_id.match(/_(\d+)$/);
          const slotIndex = match ? parseInt(match[1]) : 0;
          // Mapping slot index ke jam
          const timeSlots: Record<number, string> = {
            1: '13:00 - 15:00',
            2: '15:00 - 17:00',
            3: '17:00 - 19:00',
            4: '19:00 - 23:00'
          };
          timeRange = timeSlots[slotIndex] || '13:00 - 16:00'; // fallback default
        }
        return {
          ...slot,
          time_text: `${day} ${month} ${timeRange}`
        };
      });

    } else {
      this.pickupAdrress = {};
      this.timeSlotList = [];
    }

  } catch (err) {
    console.error("Response Error Catch /shopee/get_massshippingparam", err);
  } finally {
    this.loading = false;
  }
}
 async _getMassShippingParameterNeo(payload: QueryFields[]): Promise<{ error: boolean; object: any }> {
  try {
    this.loading = true;

    // 🔹 Hapus duplikat berdasarkan package_number
    const uniqueData = Array.from(
      new Map(payload.map(item => [item.package_number, item])).values()
    );

    // 🔹 Bagi data ke dalam batch (maks 50)
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < uniqueData.length; i += batchSize) {
      batches.push(uniqueData.slice(i, i + batchSize));
    }

    console.log(`Mengirim ${batches.length} batch (max ${batchSize} per batch)`);

    // 🔹 Jalankan semua batch paralel
    const results = await Promise.all(
      batches.map(async (batch, index) => {
        const res = await fetch('/v2/shopee/get_massshippingparam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify(batch)
        });

        if (!res.ok) throw new Error(`Batch ${index + 1} gagal`);
        return res.json();
      })
    );

    // 🔹 Gabungkan semua hasil
    const mergedPickupAddresses: any[] = [];
    const mergedDropoff: any[] = [];
    const successList: any[] = [];
    const failList: any[] = [];

    for (const result of results) {
      if (result.code === 20000 && result.data) {
        const dataReturnTemp = result.data;
        mergedPickupAddresses.push(...(dataReturnTemp.pickup_address || []));
        mergedDropoff.push(...(dataReturnTemp.dropoff_param || []));
        successList.push(...(dataReturnTemp.shipping_Param || []));
        failList.push(...(dataReturnTemp.noshipping_Param || []));
      }
    }

    console.log("DROP OFF LIST NEO:", mergedDropoff);
    console.log("SUCCESS NEO:", successList.length, "FAIL:", failList.length);

    // 🟡 Jika ada kegagalan
    if (failList.length > 0) {
      return { error: true, object: failList };
    }

    // 🟢 Jika tidak ada kegagalan, ambil pickup address utama
    if (mergedPickupAddresses.length > 0) {
      this.pickupAdrress = mergedPickupAddresses.find(addr =>
        addr.address_flag && addr.address_flag.includes("pickup_address")
      ) || mergedPickupAddresses[0];

      this.pickupObject = structuredClone(this.pickupAdrress);

      // Format time_slot_list
      const timeSlotListTemp = this.pickupAdrress.time_slot_list || [];
      this.timeSlotList = timeSlotListTemp.map((slot: any) => {
        const date = new Date(Number(slot.date) * 1000);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('id-ID', { month: 'short' });

        let timeRange = slot.time_text;
        if (!timeRange && slot.pickup_time_id) {
          const match = slot.pickup_time_id.match(/_(\d+)$/);
          const slotIndex = match ? parseInt(match[1]) : 0;
          const timeSlots: Record<number, string> = {
            1: '13:00 - 15:00',
            2: '15:00 - 17:00',
            3: '17:00 - 19:00',
            4: '19:00 - 23:00'
          };
          timeRange = timeSlots[slotIndex] || '13:00 - 16:00';
        }

        return {
          ...slot,
          time_text: `${day} ${month} ${timeRange}`
        };
      });

      return { error: false, object: this.pickupAdrress };
    }

    // 🔸 Tidak ada pickup address sama sekali
    return { error: true, object: { reason: "No pickup address found" } };

  } catch (err: any) {
    console.error("Response Error Catch /shopee/get_massshippingparam", err);
    return { error: true, object: { reason: err.message || "Unexpected error" } };
  } finally {
    this.loading = false;
  }
}

  async _updateInvoiceShipping(payload: any) {
    this.loading = true;
    const datapayload = cloneDeep(payload);
    // const uniqueData = Array.from(
    //   new Map(datapayload.map((item: { package_number: any; }) => [item.package_number, item])).values()
    // );
    fetch('/v2/shopee/upd_shippingtype', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(datapayload)
    })
      .then(res => {
        console.log("Response dari API  /shopee/upd_shippingtype", res);
        if (!res.ok) throw new Error('update QShopee Gagal');
        return res.json();
      })
      .then(async data => {
        // console.log("Response dari API /shopee/get_massshippingparam ", data);
        this.loading = false;
        if (data.code === 20000) {
          await this._lastFetchShopee();
        } else {
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/upd_shippingtype", err);
      });
  }

  async _onRowSelect() {
    // console.log("Selected 1 : ", payload);
    console.log("Pickup object : ",this.pickupAdrress)
    console.log("Selected time : ",this.selectedSlotTime)
    console.log("Selected 2 : ", this.selectProduct);
    this.ssrStorage.setItem("FORCEITEMID", this.selectProduct);
    this._langsungPrint();
  }
  async _onMassPrint() {
    console.log("Selected 3 : ", this.selectProduct);
    this.ssrStorage.setItem("FORCEITEMID", this.selectProduct);
    const resultShipping:any = await this._getMassShippingParameterNeo(this.selectProduct);
    console.log("************ Check shipping parameter ", resultShipping);
    // {
    //     "error": true,
    //     "object": [
    //         {
    //             "package_number": "OFG215184032250980",
    //             "fail_reason": "Package is not ready to ship"
    //         }
    //     ]
    // }
    if(resultShipping.error) {
      let reasonList = resultShipping.object
        .map((f: { package_number: any; fail_reason: any; }) => `📦 ${f.package_number}: ${f.fail_reason}`)
        .join('\r\n');
      this.showErrorPopup = {
        show: true,
        severity: "warn",
        message: `Tidak bisa cetak invoices:\r\n${reasonList}`,
        failedOrders: reasonList
      };

    } else {
      this._langsungPrintCounterMassal();
    }

  }
  async _onRowSelectPrinted(payload: any) {
    const fileUrl = this.selectProductPrinted.labelshopee+`?t=${Date.now()}`
    // const url = `${window.location.origin}/upload/${data.data.data.fileName}?t=${Date.now()}`; // anti-cache
          setTimeout(() => {
            const printWindow = window.open(fileUrl, '_blank');
            if (printWindow) {
              printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
              };
            } else {
              alert("Gagal membuka tab baru. Pastikan popup tidak diblokir browser.");
            }
          }, 100);
  }
   async _onRowSelectError(payload: any) {
    console.log("Item Error : ", this.selectProductError);
    // const fileUrl = this.selectProductError.labelshopee+`?t=${Date.now()}`
    // // const url = `${window.location.origin}/upload/${data.data.data.fileName}?t=${Date.now()}`; // anti-cache
    //       setTimeout(() => {
    //         const printWindow = window.open(fileUrl, '_blank');
    //         if (printWindow) {
    //           printWindow.onload = () => {
    //             printWindow.focus();
    //             printWindow.print();
    //           };
    //         } else {
    //           alert("Gagal membuka tab baru. Pastikan popup tidak diblokir browser.");
    //         }
    //       }, 100);
  }


  onGlobalSearch() {
  const term = this.globalFilter.trim().toLowerCase();
  const selectedType = this.selectSPXType?.code || ''; // ambil kode tipe, kalau null jadi string kosong

  console.log("Filter text:", term, "Filter type:", selectedType);

  this.QueriesDataPos = this.AllQueriesDataPos.filter(item => {
    const matchesText =
      term === '' ||
      [item.item_name, item.model_name, item.shipping_carrier, item.order_sn]
        .some(field => field?.toLowerCase().includes(term));

    const matchesType =
      selectedType === '' || item.shipping_carrier === selectedType;

    return matchesText && matchesType;
  });
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
  onGlobalSearchError() {
    console.log("Global filter error : ", this.globalFilterError);
    const term = this.globalFilterError.trim().toLowerCase();
    if (term === '') {
      this.QueriesDataError = [...this.AllQueriesDataError];
    } else {
      this.QueriesDataError = this.AllQueriesDataError.filter(item =>
        [item.item_name, item.model_name, item.shipping_carrier, item.order_sn]
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
  async _refreshListPrintCounter(payload:any[]): Promise<void> {
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
        console.log("Response dari API /shopee/get_data_print counter 0", res);
        if (!res.ok) throw new Error('q_shopee Gagal');
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /shopee/get_data_print counter 1", data);
        if (data.code === 20000) {
          const dataRecordsTemp: any[] = cloneDeep(data.data);
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

          await this._goPrintingCounter();


        } else {
          this.ordersPrint = []
          this.loading = false;
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /shopee/get_data_print counter", err);
      });
  }
  async _goPrinting() {
  try {
    const payload = {
      orders: this.ordersPrint,
      addressObj: this.pickupAdrress,
      timeSlot: this.selectedSlotTime
    };
    const res = await fetch('/v2/shopee/send_print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    });
    console.log("Response dari API /shopee/send_print 0", res);
    const data = await res.json();
    console.log("Response dari API /shopee/send_print 1", data);
    // ✅ Jika ada failedOrders, tampilkan alert & jangan download
    const failedOrders = data?.data?.data?.failedOrders || [];
    if (failedOrders.length > 0) {
      this.loading=false;
      const reasonList = failedOrders
        .map((f: any) => `📦 ${f.package_number}: ${f.reason}`)
        .join('\n');

      alert(`Beberapa order gagal dikirim atau sudah pernah dikirim:\n\n${reasonList}`);
      // Refresh data
      this._lastFetchShopee();
      return; // ⛔ stop agar tidak lanjut ke proses print
    }
    // ✅ Kalau tidak ada error dan ada file yang bisa diunduh
    if (data.code === 20000 && data.data?.data?.downloadResult.fileUrl) {
      const fileNameURL = data.data.data.downloadResult.fileUrl;
      const url = `${window.location.origin}/upload/${data.data.data.downloadResult.fileName}?t=${Date.now()}`;
      console.log("📄 File siap diunduh:", url);
      setTimeout(() => {
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            console.log("🖨️ Mencetak dokumen...");
            printWindow.focus();
            printWindow.print();
          };
        } else {
          alert("Gagal membuka tab baru. Pastikan popup tidak diblokir browser.");
        }

      }, 100);
    } else {
      console.log("HASIL ERROR NYA APA ", data);
      const dataMessage = data.data;
      this.showErrorPopup = {
        show: true,
        severity: "error",
        message: dataMessage?.message || "Gagal mencetak label"
      };
    }
    // Refresh data
    this._lastFetchShopee();
  } catch (err) {
    this.loading = false;
    console.error("Response Error Catch /shopee/send_print", err);
    alert("Terjadi kesalahan saat mencetak label.");
  }
  }
  async _goPrintingCounter() {
  try {
    console.log("TIME SLOT LIST ", this.timeSlotList);
    const latestSlot = this.timeSlotList[this.timeSlotList.length - 1];
    const dropoff = {
      address_id: this.pickupAdrress.address_id,
      pickup_time_id: latestSlot.pickup_time_id,
      logistics_channel_id: 80099,
      dropoff: {
        branch_id: "14590",
        sender_real_name: "JAWARA STORE OFFICIAL"
      }
    };

    const payload = {
      orders: this.ordersPrint,
      dropOffObj: dropoff
    };

    const res = await fetch('/v2/shopee/send_print_counter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Response dari API /shopee/send_print_counter", data);

    const failedOrders = data?.data?.data?.failedOrders || [];
    const downloadResult = data?.data?.data?.downloadResult;
    const hasDownload = !!downloadResult?.fileUrl;

    // ⚠️ Siapkan reasonList dan filter orders gagal
    let reasonList = "";
    let failedOrderDetails: any[] = [];

    if (failedOrders.length > 0) {
      failedOrderDetails = failedOrders.map((f: any) => ({
        order_sn: f.order_sn,
        package_number: f.package_number,
        reason: f.reason || "Unknown reason"
      }));

      reasonList = failedOrderDetails
        .map(f => `📦 ${f.order_sn}: ${f.reason}`)
        .join('\r\n');

      console.warn("⚠️ Beberapa order gagal ship:", failedOrderDetails);

      // 🔍 Filter order gagal dari this.ordersPrint berdasarkan order_sn
      const failedOrderSNs = failedOrderDetails.map(f => f.order_sn);
      const failedOrderObjects = this.ordersPrint.filter((o: any) =>
        failedOrderSNs.includes(o.order_sn)
      );

      // 🟡 Tampilkan ke popup custom milik kamu
      this.showErrorPopup = {
        show: true,
        severity: "warn",
        message: `Beberapa order gagal dikirim:\r\n${reasonList}`,
        failedOrders: failedOrderObjects
      };
    }

    // ✅ Tetap lanjut kalau ada file yang bisa diunduh
    if (data.code === 20000 && hasDownload) {
      const url = `${window.location.origin}/upload/${downloadResult.fileName}?t=${Date.now()}`;
      console.log("📄 File siap diunduh:", url);
      setTimeout(() => {
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            console.log("🖨️ Mencetak dokumen...");
            printWindow.focus();
            printWindow.print();
          };
        } else {
          alert("Gagal membuka tab baru. Pastikan popup tidak diblokir browser.");
        }
      }, 200);
    } else if (!hasDownload) {
      console.warn("⚠️ Tidak ada file untuk diunduh.");


      this.showErrorPopup = {
        show: true,
        severity: "warn",
        message:
          failedOrders.length > 0
            ? `Beberapa order tidak dicetak:\n\r${reasonList}`
            : "Tidak ada dokumen yang bisa dicetak."
      };
    }

    // 🔄 Refresh data
    this._lastFetchShopee();

  } catch (err) {
    this.loading = false;
    console.error("Response Error Catch /shopee/send_print_counter", err);
    alert("Terjadi kesalahan saat mencetak label.");
  }
  }


  formatPickupTime(epoch: number): string {
  const date = new Date(epoch * 1000);
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
}


interface QueryFields {
  order_sn?:string,
  id_q_shopee?:string,
  item_id?: string;
  item_name?: string;
  model_id?: string;
  model_name?: string;
  image_url?: string;
  shipping_carrier?: string;
  invoices?: number;
  qty?: number;
  package_number:string;
}
interface QueryFieldsPrinted {
  order_sn?:string
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
interface QueryFieldsSummary {
  shipping_carrier?: string;
  printed?: number;
  total?: number;
}
interface Column {
  field: string;
  header: string;
  class: string;
  cellclass: string;
}
