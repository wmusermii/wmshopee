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

@Component({
  standalone: true,
  selector: 'app-shopeeprintlist',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule, DatetimeComponent, TableModule],
  templateUrl: './shopeeprintlist.html',
  styleUrl: './shopeeprintlist.css'
})
export class Shopeeprintlist implements OnInit, OnDestroy {
  token: string | null | undefined = undefined;
  userInfo: any | undefined;
  orders:orderFields[] =[];
  invoicetotal: number = 0;
  invoicetotalStr: string = "Invoices : 0 pcs.";
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  ngOnInit(): void {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    const itemIDForce:any = this.ssrStorage.getItem("FORCEITEMID");
    this.orders = [
    {
      order_sn: '250729CCVPUHS7',
      order_status: 'Pending',
      total_amount: 150000,
      shipping_carrier: 'JNE',
      ship_by_date: '2025-08-15',
      items: [
        {
          item_id: '1',
          item_name: 'Buku Saku Pramuka',
          model_id: '101',
          model_name: 'Edisi 2025',
          model_quantity_purchased: '2',
          datepick: '',
          remarks: '',
        },
        {
          item_id: '2',
          item_name: 'Ring Kacu Merah',
          model_id: '102',
          model_name: 'Size M',
          model_quantity_purchased: '1',
          datepick: '',
          remarks: '',
        },
      ],
    },
    {
      order_sn: '250729XYZABCD',
      order_status: 'Shipped',
      total_amount: 200000,
      shipping_carrier: 'SiCepat',
      ship_by_date: '2025-08-16',
      items: [
        {
          item_id: '3',
          item_name: 'Buku SKU Siaga',
          model_id: '103',
          model_name: 'Softcover',
          model_quantity_purchased: '3',
          datepick: '',
          remarks: '',
        },
      ],
    },
  ];
  }
  ngOnDestroy(): void {
    console.log("DEESTROY Local Storage");
    this.ssrStorage.removeItem("FORCEITEMID");
  }
  _refreshListPrint() {

  }
}
interface orderFields{
  order_sn:string;
  order_status:string;
  total_amount:number;
  shipping_carrier:string;
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
