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
@Component({
    selector: 'app-product',
    imports: [CommonModule, FormsModule, DatetimeComponent, InputGroupModule, InputGroupAddonModule, ButtonModule, TableModule,SelectModule],
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {
  userInfo:any | undefined;
     date: Date | undefined;
    value:string | undefined;
    totalSku:string="0";
  totalStoreItem:string="0";
  totalWarehouseItem:string="0";
  totalResi:string= "0"
  itemList: any[] = [];
  dataResi: any[] = [];
  skutotal:string = "Sku:176 items";
  storeitemtotal:string = "In Store : 1500 pcs.";
  whitemtotal:string = "In Warehouse : 500 pcs.";
  invoicetotal:number = 5;
  invoicetotalStr:string = "Invoices : 10 pcs.";
  loading: boolean = false;
  token: string | null | undefined = undefined;
  products!: Product[];
  allProducts!: Product[];
  cols!: Column[];
  sortField: string = '';
  sortOrder: number = 1;
  rows = 10;
  first = 0;
  globalFilter:string ='';
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  ngOnInit(): void {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");

        this.cols = [
            { field: 'filename', header: 'Image' },
            { field: 'item_name', header: 'Product' },
            { field: 'item_condition', header: 'Condition' },
            { field: 'item_status', header: 'Status' },
            { field: 'orgBrand', header: 'Brand' },
        ];
        // data yg akan ditampilkan
        this.products=[
          {item_id:"22424855539", item_sku:"", item_name:"Pulpen 1 pack Technoline Greebel 0.5 mm 12pcs + Gratis 1", item_condition:"NEW", item_status:"NORMAL", orgBrand:"GREEBEL", filename:"/imgproducts/id-11134207-7qukz-licq99t2wt0ed6.jpg"},
          {item_id:"41401912697", item_sku:"", item_name:"Grosir Dasi Merah Doff Polos Pria Wanita Formal Instant ( 20 PCS )", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7rbk2-macg35sirnryca.jpg"},
          {item_id:"29351174921", item_sku:"", item_name:"Dasi Madrasah MI MTS MA Sekolah Ibtidaiyah Tsanawiyah Aliyah", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7r98v-lvu9t8nmnfyi9b.jpg"},
          {item_id:"22424855539", item_sku:"", item_name:"Pulpen 1 pack Technoline Greebel 0.5 mm 12pcs + Gratis 1", item_condition:"NEW", item_status:"NORMAL", orgBrand:"GREEBEL", filename:"/imgproducts/id-11134207-7qukz-licq99t2wt0ed6.jpg"},
          {item_id:"41401912697", item_sku:"", item_name:"Grosir Dasi Merah Doff Polos Pria Wanita Formal Instant ( 20 PCS )", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7rbk2-macg35sirnryca.jpg"},
          {item_id:"29351174921", item_sku:"", item_name:"Dasi Madrasah MI MTS MA Sekolah Ibtidaiyah Tsanawiyah Aliyah", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7r98v-lvu9t8nmnfyi9b.jpg"},
          {item_id:"22424855539", item_sku:"", item_name:"Pulpen 1 pack Technoline Greebel 0.5 mm 12pcs + Gratis 1", item_condition:"NEW", item_status:"NORMAL", orgBrand:"GREEBEL", filename:"/imgproducts/id-11134207-7qukz-licq99t2wt0ed6.jpg"},
          {item_id:"41401912697", item_sku:"", item_name:"Grosir Dasi Merah Doff Polos Pria Wanita Formal Instant ( 20 PCS )", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7rbk2-macg35sirnryca.jpg"},
          {item_id:"29351174921", item_sku:"", item_name:"Dasi Madrasah MI MTS MA Sekolah Ibtidaiyah Tsanawiyah Aliyah", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7r98v-lvu9t8nmnfyi9b.jpg"},
          {item_id:"22424855539", item_sku:"", item_name:"Pulpen 1 pack Technoline Greebel 0.5 mm 12pcs + Gratis 1", item_condition:"NEW", item_status:"NORMAL", orgBrand:"GREEBEL", filename:"/imgproducts/id-11134207-7qukz-licq99t2wt0ed6.jpg"},
          {item_id:"41401912697", item_sku:"", item_name:"Grosir Dasi Merah Doff Polos Pria Wanita Formal Instant ( 20 PCS )", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7rbk2-macg35sirnryca.jpg"},
          {item_id:"29351174921", item_sku:"", item_name:"Dasi Madrasah MI MTS MA Sekolah Ibtidaiyah Tsanawiyah Aliyah", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7r98v-lvu9t8nmnfyi9b.jpg"},
          {item_id:"22424855539", item_sku:"", item_name:"Pulpen 1 pack Technoline Greebel 0.5 mm 12pcs + Gratis 1", item_condition:"NEW", item_status:"NORMAL", orgBrand:"GREEBEL", filename:"/imgproducts/id-11134207-7qukz-licq99t2wt0ed6.jpg"},
          {item_id:"41401912697", item_sku:"", item_name:"Grosir Dasi Merah Doff Polos Pria Wanita Formal Instant ( 20 PCS )", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7rbk2-macg35sirnryca.jpg"},
          {item_id:"29351174921", item_sku:"", item_name:"Dasi Madrasah MI MTS MA Sekolah Ibtidaiyah Tsanawiyah Aliyah", item_condition:"NEW", item_status:"NORMAL", orgBrand:"ARNAD", filename:"/imgproducts/id-11134207-7r98v-lvu9t8nmnfyi9b.jpg"}
        ]
        // semua data asli
        this.allProducts=this.products;


  }
  _searchClick(){
    console.log("Button Search di Click");
  }
  onSort(event: any) {
        this.sortField = event.field;
        this.sortOrder = event.order;
  }
  _refreshProduct(){

  }
  changeRows(newRows: number, currentPage: number) {
  this.rows = newRows;
  // Recalculate starting index (first) based on current page
  this.first = newRows * currentPage;
  localStorage.setItem('product_table_rows', this.rows.toString());
  }
  onGlobalSearch() {
    console.log("Global filter : ", this.globalFilter);
  const term = this.globalFilter.trim().toLowerCase();
  if (term === '') {
    this.products = [...this.allProducts];
  } else {
    this.products = this.allProducts.filter(item =>
      [item.item_name, item.item_sku, item.orgBrand]
        .some(field => field?.toLowerCase().includes(term))
    );
  }
  }

}
interface Product {
    item_id: string;
    item_sku: string;
    item_name: string;
    item_condition: string;
    item_status: string;
    orgBrand: string;
    filename:string;
}
interface Column {
    field: string;
    header: string;
}
