import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { InputTextModule } from 'primeng/inputtext';
import { DatetimeComponent } from '../../../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../../../guard/ssr/localstorage/localstorage.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-detailinvoice',
  imports: [CommonModule,ButtonModule, InputTextModule, DataViewModule,DatetimeComponent],
  templateUrl: './detailinvoice.html',
  styleUrl: './detailinvoice.css'
})
export class Detailinvoice implements OnInit, OnDestroy {
    token: string | null | undefined = undefined;
    userInfo: any | undefined;
    jobOrderSN:  | null | undefined = undefined;
    listItem:ItemFields[]=[]
    ssrStorage = inject(LocalstorageService);
    loading = false;
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
    async _refreshItemsInResi(){
      this.loading=true;
      let payload = {order_sn:this.jobOrderSN}
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
              if (!res.ok) throw new Error('get_items_packages Gagal');this.loading=false;
              return res.json();
            })
            .then(data => {
              console.log("Response dari API /warehouse/get_packages", data);
              if (data.code === 20000) {
                const dataRecordsTemp = cloneDeep(data.data);this.loading=false;
                this.listItem = dataRecordsTemp;
              } else {
                this.listItem = [];
              }
            })
            .catch(err => {
              this.loading=false;
              console.log("Response Error Catch /warehouse/get_packages", err);
            });
        }
}
interface ItemFields {
  id_q_shopee: number;
  order_sn: string;
  item_id: string;
  item_name:string;
  item_sku:string;
  model_id:string;
  model_name:string;
  qty:number;
  image_url:string;
  status: number;
  create_time: string;
}
// {
//     "id_q_shopee": 2,
//     "order_sn": "250729CCVPUHS7",
//     "item_id": "19771419636.0",
//     "item_name": "Buku Saku Pramuka SD SMP SMA Siaga Penggalang Penegak",
//     "item_sku": "",
//     "model_id": "168788019413.0",
//     "model_name": "BUKU SAKU",
//     "qty": 1,
//     "image_url": "https://cf.shopee.co.id/file/id-11134207-7rbk0-m7g36u6sa4yd72_tn",
//     "status": 0,
//     "create_time": "2025-07-29 01:22:46"
// }
