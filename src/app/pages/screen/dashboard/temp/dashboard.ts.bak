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
@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule,ChipModule, DatetimeComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  loadingUser = true;
  token: string | null | undefined = undefined;
    userInfo:any | undefined;
     date: Date | undefined;
    value:string | undefined;
    loading:boolean = false;
    totalSku:string="0";
  totalStoreItem:string="0";
  totalWarehouseItem:string="0";
  totalResi:number= 0
  itemList: any[] = [];
  dataResi: any[] = [];
  groupName:string| undefined=undefined
  skutotal:string = "Sku : 176 items";
  storeitemtotal:string = "In Store : 1500 pcs.";
  whitemtotal:string = "In Warehouse : 500 pcs.";
  invoicetotal:number = 5;
  invoicetotalStr:string = "Invoices : 10 pcs.";
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  ngOnInit(): void {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    console.log("USER INFO ", this.userInfo);
    this._refreshCountInvoices();
    this._refreshCountSKU();


  }
  async _refreshCountInvoices(){
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
            console.log("Response dari API  /warehouse/get_sku_count", res);
            if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
            return res.json();
          })
          .then(data => {
            console.log("Response dari API /warehouse/get_sku_count", data);
            if (data.code === 20000) {
              // this.listInvoices = [];
              this.totalSku = data.data.skuQty;
              this.skutotal = `Sku : ${this.totalSku} items`
              this.loadingUser=false;
            } else {
              // this.listInvoices = [];
              this.totalSku = "0";
              this.skutotal = `Sku : ${this.totalSku} items`
              this.loadingUser=false;
            }
          })
          .catch(err => {
            this.loading = false;
            console.log("Response Error Catch /warehouse/get_sku_count", err);
          });
    }

    _goToPackaging(){
      this.router.navigate(['/packaging']);
    }
}

