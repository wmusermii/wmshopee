import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DatetimeComponent } from '../../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../../guard/ssr/localstorage/localstorage.service';

@Component({
  standalone:true,
  selector: 'app-stockopnamedetail',
  imports: [CommonModule, FormsModule,RouterModule ,ReactiveFormsModule, DatetimeComponent, InputGroupModule, InputTextModule, InputGroupAddonModule, ButtonModule, TableModule, SelectModule, ChipModule, DatePickerModule],
  templateUrl: './stockopnamedetail.html',
  styleUrl: './stockopnamedetail.css'
})
export class Stockopnamedetail implements OnInit, OnDestroy {

  userInfo: any | undefined;
  opnameID:number | undefined;
  opnameObj:any | undefined;
  date: Date | undefined;
  value: string | undefined;
  loading: boolean = false;
  token: string | null | undefined = undefined;
  opnames!: opname[];
  showGenerateDialog:boolean = false;
  showStocksDialog:boolean = false;
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
  ngOnInit(): void {
    // throw new Error('Method not implemented.');
     this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    this.opnameObj = this.ssrStorage.getItem("OPITM");

    this.opnameID = this.opnameObj.id_opname;
    console.log("OPNAME ", this.opnameObj);
    console.log("ID OPNAME ", this.opnameID);
     this.cols = [
      { field: 'opname_id', header: 'OP Id' },
      { field: 'product_id', header: 'Product Id' },
      { field: 'system_qty', header: 'System Qty' },
      { field: 'physical_qty', header: 'Physical Qty' },
      { field: 'adjustment_qty', header: 'Adjust Qty' },
      { field: 'opname_date', header: 'Status' },
      { field: 'created_by', header: 'Create By' },
      { field: 'id_opname', header: 'Id Opname' }
    ];
  }
  ngOnDestroy(): void {
    // throw new Error('Method not implemented.');
    this.ssrStorage.removeItem('OPITM');

  }
  async _onSubmit():Promise<void> {
    // return {}
    if(this.opnameForm.valid) {

    }
  }
  _closeProduct() {
     this.showStocksDialog = false;
  }
  _addStock(){
    this.showStocksDialog = true;
  }
  _backToList(){
    this.router.navigate([`/management/stockopname`]);
  }
  async _editOpname(payload:any):Promise<void>{
    console.log(payload);
  }

   async _cancelGenerate():Promise<void> {
    this.showGenerateDialog=false;
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
