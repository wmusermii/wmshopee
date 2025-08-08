import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatetimeComponent } from '../../../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../../../guard/ssr/localstorage/localstorage.service';
import { cloneDeep } from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'app-detailinvoice',
  imports: [CommonModule, ButtonModule, InputTextModule, DataViewModule, DatetimeComponent, DialogModule],
  templateUrl: './detailinvoice.html',
  styleUrl: './detailinvoice.css'
})
export class Detailinvoice implements OnInit, OnDestroy {
  //##################################################
    isEmptyFirst:boolean = false;
    isDoneChecked:boolean = false;
  //##################################################
  token: string | null | undefined = undefined;
  userInfo: any | undefined;
  jobOrderSN: | null | undefined = undefined;
  listItemTemp: ItemFields[] = []
  listItem: ItemFields[] = []
  ssrStorage = inject(LocalstorageService);
  loading = false;
  selectedItem: any = null;
  showPrintDialog:any = {show:false, title:"Printing", message:"Print this order before take other job?"}
  constructor(private router: Router) { }
  async ngOnInit(): Promise<void> {
    console.log("Implement DetailInvoice");
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    this.jobOrderSN = this.ssrStorage.getItem("J_TAKEN");
    await this._refreshItemsInResi();
  }
  ngOnDestroy(): void {
    console.log("Destroy detail");
    this.ssrStorage.removeItem("J_TAKEN");
  }
  async _refreshItemsInResi() {
    this.loading = true;
    let payload = { order_sn: this.jobOrderSN }
    console.log("Refresh ITEMS In RESI");
    fetch('/v2/warehouse/get_items_packages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API  /warehouse/get_items_packages", res);
        if (!res.ok) throw new Error('get_items_packages Gagal'); this.loading = false;
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /warehouse/get_packages", data);
        if (data.code === 20000) {
    //       isEmptyFirst:boolean = false;
    // isDoneChecked:boolean = false;
          const dataRecordsTemp = cloneDeep(data.data);
          //############## CHECK APAKAH MEMANG KOSONG ################
          if(dataRecordsTemp.length > 0) {
             this.isEmptyFirst = false;
             this.listItem = await this.filterValidRecords(dataRecordsTemp);
             console.log("LIST ITEMS JUMLAH ", this.listItem.length);
             if(this.listItem.length < 1) this.isDoneChecked= true;
          } else {
            this.isEmptyFirst = true;
          }
          this.loading = false;
        } else {
          this.listItem = [];
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_packages", err);
      });
  }
  async _updateItemsInResi() {
    console.log("Selected Item : ",this.selectedItem);
    this.loading = true;
    let payload = this.selectedItem
    console.log("update ITEMS In RESI");
    fetch('/v2/warehouse/update_items_packages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API  /warehouse/update_items_packages", res);
        if (!res.ok) throw new Error('update_items_packages Gagal'); this.loading = false;
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /warehouse/update_items_packages", data);

        // if (data.code === 20000) {
        //   const dataRecordsTemp = cloneDeep(data.data); this.loading = false;
        //   this.listItem = dataRecordsTemp;
        // } else {
        //   this.listItem = [];
        // }
        await this._refreshItemsInResi();
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/update_items_packages", err);
      });
  }
  onClickInvoice(payload: any) {
    console.log(payload);
    this.selectedItem = payload;
  }
  closeDialog() {

    this.selectedItem = null;
  }
  async closeSubmitDialog() {
    await this._updateItemsInResi()
    this.selectedItem = null;
  }

  getStatus(status: number) {
    switch (status) {
      case 0:
        return 'UNCHECKED';
      case 1:
        return 'CHECKED';
      default:
        return 'UNPROCESSED';
    }
  }
  async filterValidRecords(data: any[]): Promise<any[]> {
    return data.filter(record => record.status <= 0);
  }
  async _saveNextJob() {
    this.showPrintDialog = {show:true, title:"Printing", message:"Print this order before take other job?"};
    // this.router.navigate(['/packaging']);
  }
  async confirmPrinting(){
    this.loading=true;
    this.showPrintDialog = {show:false, title:"Printing", message:"Print this order before take other job?"};
    await this._generatePrinting(this.jobOrderSN)

    return;
  }
  async cancelPrinting() {
    this.showPrintDialog = {show:false, title:"Printing", message:"Print this order before take other job?"}; return
  }
  async _nextJob() {
    this.router.navigate(['/packaging']);
  }
  async _generatePrinting(payloadStr: any) {
    console.log("##### AWAIT PRINTING ", payloadStr);
    const payload = {order_sn:payloadStr};
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
      .then(data => {
        console.log("Response dari API /shopee/send_print 1", data);
        if (data.code === 20000) {
          // const dataRecords = data.data;
          // const dataRecordsTemp = cloneDeep(data.data);;
          // dataRecordsTemp.forEach((record: { status: number | string }) => {
          //   if (record.status === 0) {
          //     record.status = 'OPEN';
          //   } else if (record.status === 1) {
          //     record.status = 'PROCEED';
          //   } else {
          //     record.status = 'UNKNOWN';
          //   }
          // });
          // this.QueriesData = dataRecordsTemp;
          this.loading = false;
          this._nextJob();return
        } else {
          this.loading = false
          // this.listMenu = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/send_print", err);
        // this.showConfirmDialog = true;
      });
  }
}
interface ItemFields {
  id_q_shopee: number;
  order_sn: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  model_id: string;
  model_name: string;
  qty: number;
  image_url: string;
  status: number;
  create_time: string;
}

