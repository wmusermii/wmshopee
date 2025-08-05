import { Component, OnInit } from '@angular/core';
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';
import { FormsModule } from '@angular/forms';
//##########################PRIMENG################################
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { Router } from '@angular/router';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { InputTextModule } from 'primeng/inputtext';
@Component({
    selector: 'app-product',
    imports: [CommonModule, FormsModule, DatetimeComponent, InputGroupModule,InputTextModule, InputGroupAddonModule, ButtonModule, TableModule,SelectModule],
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {

  userInfo:any | undefined;
     date: Date | undefined;
    value:string | undefined;
  loading: boolean = false;
  token: string | null | undefined = undefined;
  products!: Product[];
  totalProduct:number = 0;
  allProducts!: Product[];
  cols!: Column[];
  rows = 10;
  globalFilter:string ='';
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  async ngOnInit(): Promise<void> {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");

        this.cols = [
            { field: 'filename', header: 'Image' },
            { field: 'item_name', header: 'Product' },
            { field: 'model_name', header: 'Model' },
            { field: 'item_condition', header: 'Condition' },
            { field: 'item_status', header: 'Status' },
            { field: 'orgBrand', header: 'Brand' },
        ];
        await this._refreshProduct()
  }
  _searchClick(){
    console.log("Button Search di Click");
  }
  onSort(event: any) {
        // this.sortField = event.field;
        // this.sortOrder = event.order;
  }
  async _refreshProduct(){
    this.loading = true;
        fetch('/v2/warehouse/get_sku_all', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          }
        })
          .then(res => {
            console.log("Response dari API  /warehouse/get_sku_all", res);
            if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
            return res.json();
          })
          .then(async data => {
            console.log("Response dari API /warehouse/get_sku_all", data);
            if (data.code === 20000) {
              const updatedProduct = data.data;
              this.loading=false;
              this.products = updatedProduct;
              this.allProducts= updatedProduct;
              this.totalProduct=this.allProducts.length;

            } else {
              this.loading=false
              this.allProducts=[];
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
  if (term === '') {
    this.products = [...this.allProducts];
  } else {
    this.products = this.allProducts.filter(item =>
      [item.item_name, item.item_sku, item.orgBrand, item.model_name]
        .some(field => field?.toLowerCase().includes(term))
    );
  }
  }
  async _manualSearch(){

  }
  async _addProduct(){

  }
}
interface Product {
    item_id: string;
    item_sku: string;
    item_name: string;
    item_condition: string;
    item_status: string;
    model_name: string;
    orgBrand: string;
    filename:string;
}
interface Column {
    field: string;
    header: string;
}
