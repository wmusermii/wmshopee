import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-stockopname',
  imports: [CommonModule, FormsModule,RouterModule ,ReactiveFormsModule, DatetimeComponent, InputGroupModule, InputTextModule, InputGroupAddonModule, ButtonModule, TableModule, SelectModule, ChipModule, DatePickerModule],
  templateUrl: './stockopname.html',
  styleUrl: './stockopname.css'
})
export class Stockopname implements OnInit {
  userInfo: any | undefined;
  date: Date | undefined;
  value: string | undefined;
  loading: boolean = false;
  token: string | null | undefined = undefined;
  opnames!: opname[];
  showGenerateDialog:boolean = false;
  totalOpname: number = 0;
  allOpnames!: opname[];
  cols!: Column[];
  warehouseArray:any[] = []
  rows = 10;
  globalFilter: string = '';
   opnameForm = new FormGroup({
      opname_date: new FormControl(new Date(), [Validators.required]),
      wh_id: new FormControl(''),
      wh_obj: new FormControl(null, [Validators.required]),
  });
   constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  async ngOnInit(): Promise<void> {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    this.ssrStorage.removeItem("OPITM");
    this.cols = [
      { field: 'id_opname', header: 'Id Opname' },
      { field: 'opname_date', header: 'Opname Date' },
      { field: 'warehouse_name', header: 'Warehouse' },
    ];
    await this._refreshWarehouse();
    await this._refreshStockOpname();
  }
  _addStockOpname(){
      this.showGenerateDialog=true;
  }
  async _refreshStockOpname(){
     this.loading = true;
    fetch('/v2/warehouse/get_stockopname_all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /warehouse/get_stockopname_all", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /warehouse/get_stockopname_all", data);
        if (data.code === 20000) {
          const updatedWH = data.data;
          this.loading=false;
          this.opnames = updatedWH;
          this.allOpnames= updatedWH;
          this.totalOpname=this.allOpnames.length;
        } else {
          this.loading = false
          this.allOpnames=[];
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_stockopname_all", err);
      });
  }
  async _refreshWarehouse(){
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
          this.warehouseArray = updatedWH;
        } else {
          this.warehouseArray=[]
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_stockopname_all", err);
      });
  }
  async _addnewOpname(payload:any){
    this.loading= true;
    fetch('/v2/warehouse/insert_stockopname', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API ", res);
        // logInfo
        if (!res.ok) throw new Error('Login gagal');
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API DATA ", data);

        if(data.code === 20000) {
          this.showGenerateDialog=false;
          await this._refreshStockOpname();
        } else {
          this.loading=false;
          // this.errorMessage = {error:true, severity:"error", message:`${data.message}`, icon:"pi pi-times"}
        }
      })
      .catch(err => {
        console.log("Response Error ", err);
        // alert('Login gagal: ' + err.message);
        // this.errorMessage = {error:true, severity:"error", message:`${err}`, icon:"pi pi-times"}
      });
  }
  async _updateOpname(payload:any){
    this.loading= true;
    fetch('/v2/warehouse/update_stockopname', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ payload })
    })
      .then(res => {
        console.log("Response dari API ", res);
        // logInfo
        if (!res.ok) throw new Error('Login gagal');
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API DATA ", data);

        if(data.code === 20000) {
          this.showGenerateDialog=false;
          await this._refreshStockOpname();
        } else {
          this.loading=false;
          // this.errorMessage = {error:true, severity:"error", message:`${data.message}`, icon:"pi pi-times"}
        }
      })
      .catch(err => {
        console.log("Response Error ", err);
        // alert('Login gagal: ' + err.message);
        // this.errorMessage = {error:true, severity:"error", message:`${err}`, icon:"pi pi-times"}
      });
  }
  // Helper getter untuk akses kontrol form di template
  get f() {
    return this.opnameForm.controls;
  }
  async _onSubmit():Promise<void> {
    // return {}
    if(this.opnameForm.valid) {

      let payload:any = this.opnameForm.value;
      payload.wh_id = payload.wh_obj.warehouse_id
      // this.showGenerateDialog=false;
      console.log(payload);
      await this._addnewOpname(payload);
    }
  }
  async _cancelGenerate():Promise<void> {
    this.showGenerateDialog=false;
  }
  async _detailOpname(payload:any):Promise<void> {
    // console.log("Data tod detail ", payload);
    this.ssrStorage.setItem("OPITM", payload)
    this.router.navigate([`/management/stockopname/view`]);
  }
}
interface Column {
  field: string;
  header: string;
}
interface opname {
  id_opname: number;
  wh_id: string;
  warehouse_name: string | null;
  opname_date: string;
  opname_by: string;
  status: number;
}
