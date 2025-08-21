import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { Router } from '@angular/router';
import { cloneDeep } from 'lodash';

@Component({
  standalone: true,
  selector: 'app-shopeeprintlist',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule, DatetimeComponent, TableModule],
  templateUrl: './shopeeprintlist.html',
  styleUrl: './shopeeprintlist.css'
})
export class Shopeeprintlist implements OnInit, OnDestroy {
  token: string | null | undefined = undefined;
  showGenerateDialog: boolean = false;
  userInfo: any | undefined;
  loading: boolean = true;
  itemIDForce:any | undefined;
  orders:orderFields[] =[];
  invoicetotal: number = 0;
  invoicetotalStr: string = "Invoices : 0 pcs.";
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  ngOnInit(): void {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    this.itemIDForce = this.ssrStorage.getItem("FORCEITEMID");
    console.log("HASIL Session ", this.itemIDForce.item_id);
    this._refreshListPrint();
  }
  ngOnDestroy(): void {
    console.log("DEESTROY Local Storage");
    this.ssrStorage.removeItem("FORCEITEMID");
  }
  _refreshListPrint() {
    const payload = {item_id:this.itemIDForce.item_id}
    fetch('/v2/shopee/get_data_print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API /shopee/get_data_print 0", res);
        if (!res.ok) throw new Error('q_shopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/get_data_print 1", data);
        this.loading=false;
        if (data.code === 20000) {
          const dataRecordsTemp = cloneDeep(data.data);
          this.orders = this.transformOrders(dataRecordsTemp);
          this.invoicetotal = this.orders.length
          this.invoicetotalStr =`Invoices : ${this.invoicetotal} pcs.`
        } else {
          this.loading=false;
          this.orders=[];
          this.invoicetotal = this.orders.length
          this.invoicetotalStr =`Invoices : ${this.invoicetotal} pcs.`
        }
      })
      .catch(err => {
        this.loading=false;
        this.orders=[];
          this.invoicetotal = this.orders.length
          this.invoicetotalStr =`Invoices : ${this.invoicetotal} pcs.`
        console.log("Response Error Catch /shopee/get_data_print", err);
      });
  }
  _popupPrinting(){
    this.showGenerateDialog=true;
  }
  async _goPrinting(){
    console.log("Payload 1 ", this.orders);
    const payload = {orders:this.orders}
    console.log("Payload 2 ", payload);
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
        if(data.code === 20000) {
          const fileNameOri = data.data.data.fileName;
          // const fileName = response.data.data.fileName;
          // const url = `${window.location.origin}/upload/${fileNameOri}`;
          // window.open(url, '_blank');
           const url = `${window.location.origin}/upload/${fileNameOri}?t=${Date.now()}`; // anti-cache
            setTimeout(() => {
              window.open(url, '_blank');
            }, 1000); // kasih jeda biar file ready
        }
        this.loading=false;
        this.router.navigate(['/dashboard']);
      })
      .catch(err => {
        this.loading=false;
        console.log("Response Error Catch /shopee/send_print", err);
      });
  }
  async _startPrint(){
    this.showGenerateDialog=false;
    this.loading= true;
    await this._goPrinting();
  }
  _cancelPrint(){
    this.showGenerateDialog = false;
  }
  transformOrders(data: any[]): orderFields[] {
  const groupedOrders: { [key: string]: orderFields } = {};

  data.forEach(item => {
    if (!groupedOrders[item.order_sn]) {
      groupedOrders[item.order_sn] = {
        order_sn: item.order_sn,
        order_status: item.order_status,
        total_amount: item.total_amount,
        shipping_carrier: item.shipping_carrier,
        package_number:item.package_number,
        ship_by_date: item.ship_by_date || '', // kalau ada field ini di data asli
        items: []
      };
    }

    groupedOrders[item.order_sn].items.push({
      item_id: item.item_id,
      item_name: item.item_name,
      model_id: item.model_id || '', // kalau ada model_id di data asli
      model_name: item.model_name,
      model_quantity_purchased: String(item.model_quantity_purchased),
      datepick: '',
      remarks: ''
    });
  });

  return Object.values(groupedOrders);
}

}
interface orderFields{
  order_sn:string;
  order_status:string;
  total_amount:number;
  shipping_carrier:string;
  package_number:string | null;
  ship_by_date:string;
  items:itemsFields[];
}
interface itemsFields {
  item_id: string;
  item_name: string;
  model_id: string;
  model_name: string;
  model_quantity_purchased: string;
  datepick: string;
  remarks: string;
}
