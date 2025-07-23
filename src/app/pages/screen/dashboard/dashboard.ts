import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatetimeComponent } from "../../../layouts/directive/datetime/datetime.component";
//######################### PRIMENG ##############################
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ChipModule } from 'primeng/chip';
@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule,ChipModule, DatetimeComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {
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
}
