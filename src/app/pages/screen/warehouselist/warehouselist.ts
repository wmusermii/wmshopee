import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';
import { Router, RouterModule } from '@angular/router';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-warehouselist',
  imports: [CommonModule, FormsModule,RouterModule ,ReactiveFormsModule, DatetimeComponent, InputGroupModule, InputTextModule, InputGroupAddonModule, ButtonModule, TableModule, SelectModule, ChipModule],
  templateUrl: './warehouselist.html',
  styleUrl: './warehouselist.css'
})
export class Warehouselist implements OnInit {
  userInfo: any | undefined;
  date: Date | undefined;
  value: string | undefined;
  loading: boolean = false;
  token: string | null | undefined = undefined;
  warehouses!: Warehouse[];
  showGenerateDialog:boolean = false;
  totalWarehouse: number = 0;
  allWarehouse!: Warehouse[];
  cols!: Column[];
  rows = 10;
  globalFilter: string = '';
  warehouseForm = new FormGroup({
      warehouse_code: new FormControl('', [Validators.required]),
      warehouse_name: new FormControl('', [Validators.required]),
      is_store: new FormControl('', [Validators.required]),
  });
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  async ngOnInit(): Promise<void> {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");

    this.cols = [
      { field: 'warehouse_id', header: 'Code' },
      { field: 'warehouse_name', header: 'Name' },
      { field: 'is_store', header: 'Status' }
    ];
    await this._refreshWarehouse()
  }
  async _refreshWarehouse() {
    this.loading = true;
    fetch('/v2/warehouse/get_warehouse_all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /warehouse/get_warehouse_all", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /warehouse/get_warehouse_all", data);
        if (data.code === 20000) {
          const updatedWH = data.data;
          this.loading=false;
          this.warehouses = updatedWH;
          this.allWarehouse= updatedWH;
          this.totalWarehouse=this.allWarehouse.length;
        } else {
          this.loading = false
          // this.allProducts=[];
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_sku_count", err);
      });
  }
  onGlobalSearch() {
    console.log("Global filter : ", this.globalFilter);
    const term = this.globalFilter.trim().toLowerCase();
    // if (term === '') {
    //   this.products = [...this.allProducts];
    // } else {
    //   this.products = this.allProducts.filter(item =>
    //     [item.item_name, item.item_sku, item.orgBrand, item.model_name]
    //       .some(field => field?.toLowerCase().includes(term))
    //   );
    // }
  }
  async _manualSearch() {

  }
  async _addWarehouse() {
    this.showGenerateDialog = true;
  }
  onSubmit() {

  }
  // Helper getter untuk akses kontrol form di template
  get f() {
    return this.warehouseForm.controls;
  }
}
interface Column {
  field: string;
  header: string;
}
interface Warehouse {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  is_store: number;
}
