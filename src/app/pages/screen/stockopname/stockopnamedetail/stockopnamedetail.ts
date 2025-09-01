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
  stkopnames!:stockObj[];
  allStkopnames!:stockObj[];
  selectedStkOpname!:stockObj;
  showStockDetailDialog = false;
  physicalStock: number = 0;
  showGenerateDialog:boolean = false;
  showStocksDialog:boolean = false;
  stocksToOpname:any[]|undefined = [];
  totalOpname: number = 0;
  allOpnames!: opname[];
  cols!: Column[];
  cols2!: Column[];
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
    // throw new Error('Method not implemented.');
     this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    this.opnameObj = this.ssrStorage.getItem("OPITM");
    this.opnameID = this.opnameObj.id_opname;
    console.log("Object to opname ", this.opnameObj);
     this.cols = [
      { field: 'opname_id', header: 'Id' },
      { field: 'product_name', header: 'Item' },
      { field: 'model_name', header: 'Model' },
      { field: 'system_qty', header: 'Sys Qty' },
      { field: 'physical_qty', header: 'Phy Qty' },
      { field: 'adjustment_qty', header: 'Adj Qty' },
      { field: 'opname_date', header: 'Periode' }
    ];
    this.cols2 = [
      { field: 'image_url', header: 'Image' },
      { field: 'item_name', header: 'Product' },
      { field: 'model_name', header: 'Model' }
    ];
    await this._refreshStockOnTransaction();
    await this._refreshStockOnOpname();
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
  async _refreshStockOnOpname():Promise<void> {
    const payload= this.opnameObj;
    console.log("Payload ", payload);
    fetch('/v2/warehouse/get_stockopnamedetail', {
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
        console.log("Response dari API get_stockopnamedetail ", data);
        if(data.code === 20000) {
          this.loading=false;
            let updatedStk = data.data;
            updatedStk = await this.mapOpnameData(updatedStk);
            console.log("updated data ", updatedStk);
            this.loading=false;
            this.opnames = updatedStk;
            this.allOpnames= updatedStk;



        } else {
          this.loading=false;
          this.opnames = [];this.allOpnames=[]

        }
      })
      .catch(err => {
        console.log("Response Error ", err);
      });

  }
  async _refreshStockOnTransaction():Promise<void> {
      this.loading = true;
    fetch('/v2/warehouse/get_stocks_so', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /warehouse/get_stocks_so", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /warehouse/get_stocks_so", data);
        if (data.code === 20000) {
          const updatedStk = data.data;
          this.loading=false;
          this.stkopnames = updatedStk;
          this.allStkopnames= updatedStk;
          // this.totalOpname=this.allOpnames.length;
        } else {
          this.loading = false
          // this.allOpnames=[];
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_stockopname_all", err);
      });
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

  async _exportList():Promise<void>{
    const payload= this.opnameObj;
    console.log("Payload ", payload);
    fetch('/v2/warehouse/get_stockopnamedetailExport', {
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
        console.log("Response dari API get_stockopnamedetailExport ", data);
        if(data.code === 20000) {
          this.loading=false;

          const url = `${data.data}?t=${Date.now()}`; // anti-cache
            setTimeout(() => {
              window.open(url, '_blank');
            }, 1000);


        } else {
          this.loading=false;
        }
      })
      .catch(err => {
        console.log("Response Error ", err);
      });
  }

  async _editOpname(payload:any):Promise<void>{
    console.log(payload);
  }

   async _cancelGenerate():Promise<void> {
    this.showGenerateDialog=false;
  }
  onGlobalSearch() {
    console.log("Global filter : ", this.globalFilter);
  const term = this.globalFilter.trim().toLowerCase();
  if (term === '') {
    this.stkopnames = [...this.allStkopnames];
  } else {
    this.stkopnames = this.allStkopnames.filter(item =>
      [item.item_name, item.model_name]
        .some(field => field?.toLowerCase().includes(term))
    );
  }
  }
  onRowSelect(event:any) {
    console.log("Selected object ", this.selectedStkOpname);
    this.showStocksDialog = false;
    this.showStockDetailDialog = true;
  }
  closeStockDetailDialog() {
    this.showStockDetailDialog = false;
  }

  submitPhysicalStock() {
    console.log('Physical Stock submitted:', this.physicalStock, this.selectedStkOpname);
    this.showStockDetailDialog = false;
    this.loading=true;
    const payload = {id_opname:this.opnameObj.id_opname, opname_date:this.opnameObj.opname_date,wh_id:this.opnameObj.wh_id, physical_qty:this.physicalStock,product_id:this.selectedStkOpname.id_stock,product_name:this.selectedStkOpname.item_name,item_id:this.selectedStkOpname.item_id, model_name:this.selectedStkOpname.model_name,model_id:this.selectedStkOpname.model_id }
    // console.log("PAYLOAD TO SUBMIT ", payload);
    fetch('/v2/warehouse/insert_stockopnamedetail', {
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
          this.loading=false;
          await this._refreshStockOnOpname();
        } else {
          this.loading=false;
          await this._refreshStockOnOpname();
        }
      })
      .catch(err => {
        console.log("Response Error ", err);
      });
  }
 async mapOpnameData(data: any[]): Promise<any[]> {
  return data.map(item => ({
    ...item,
    adjustment_qty: item.physical_qty - item.system_qty
  }));
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
interface stockObj {
  item_id: string,
  item_sku: string | null,
  item_name: string,
  model_id: string,
  model_name: string,
  image_url: string,
  id_stock: string
}
