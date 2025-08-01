import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { DatetimeComponent } from '../../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../../guard/ssr/localstorage/localstorage.service';
import { DataViewModule } from 'primeng/dataview';
import { Router } from '@angular/router';
import { cloneDeep } from 'lodash';
@Component({
  standalone: true,
  selector: 'app-listinvoice',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule, DataViewModule, DatetimeComponent],
  templateUrl: './listinvoice.html',
  styleUrl: './listinvoice.css'
})
export class Listinvoice implements OnInit {

  token: string | null | undefined = undefined;
  userInfo: any | undefined;
  date: Date | undefined;
  fromtime: Date | undefined;
  totime: Date | undefined;
  value: string | undefined;
  selectedResi: InvoiceFields | undefined;
  loading = false;
  //################################
  showGenerateDialog: boolean = false;
  showProcessJobDialog: boolean = false;
  showProcedPostDialog: boolean = false;
  showErrorDialog: boolean = false;
  listInvoices: InvoiceFields[] = []
  ssrStorage = inject(LocalstorageService);
  submitted = false;
  constructor(private router: Router) { }
  async ngOnInit(): Promise<void> {
    console.log("Initial ListInvoice");
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    //############## SEMENTARA ########################
    this.listInvoices = [
      { id_q_shopee: 2, create_time: '2025-07-29 01:22:46', order_status: 'READY_TO_SHIP', total_amount: 10020, update_time: null, status: 0, order_sn: '250729CCVPUHS7', ship_by_date: '2025-07-29 23:59:59' },
      { id_q_shopee: 2, create_time: '2025-07-29 01:08:42', order_status: 'READY_TO_SHIP', total_amount: 7568, update_time: null, status: 0, order_sn: '250729CC3JWVRE', ship_by_date: '2025-07-29 23:59:59' }
    ]
    console.log('Invoices Loaded:', this.listInvoices);
    await this._refreshListResi();
  }
  onClickInvoice(item: InvoiceFields) {
    this.selectedResi = item;
    console.log('Invoice clicked:', item);
    this.showProcessJobDialog = true;

    // Arahkan ke detail atau buka dialog
  }
  async confirmJobsProcess() {
    console.log(" KERJAKAN JOB");
    // const payload:any = {order_sn: }
    const isResiTaken: any = await this._checkResiTaken();
    this.showProcessJobDialog = false;
    console.log("hasil wait : ", isResiTaken);
    if (isResiTaken) {
      if (isResiTaken.code === 20400) {
        this.ssrStorage.setItem("J_TAKEN", this.selectedResi?.order_sn);
        this.router.navigate(['/packaging/detail']);
      } else {
        this.showErrorDialog = true;
      }
    } else {
      this.showErrorDialog = true;
    }
  }
  cancelErrorProcess() {
    console.log(" BATAL ERROR");
    this.showErrorDialog = false;
  }
  cancelJobProcess() {
    console.log(" BATAL JOB");
    this.showProcessJobDialog = false;
  }
  getStatus(status: number) {
    switch (status) {
      case 0:
        return 'OPEN';
      case 1:
        return 'PROCESS';
      default:
        return 'UNPROCESSED';
    }
  }
  async _checkResiTaken() {
    this.loading = true;
    try {
      const res = await fetch('/v2/warehouse/check_taken_packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ order_sn: this.selectedResi?.order_sn })
      });

      if (!res.ok) {
        throw new Error('get QShopee Gagal');
      }

      const data = await res.json();
      console.log("Response dari API /warehouse/check_taken_packages", data);
      return data; // ✅ penting!
    } catch (err) {
      console.log("Response Error Catch /warehouse/check_taken_packages", err);
      return null; // atau bisa return object error juga
    } finally {
      this.loading = false;
    }
  }

  async _refreshListResi() {
    this.loading = true;
    fetch('/v2/warehouse/get_packages', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /warehouse/get_packages", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /warehouse/get_packages", data);
        if (data.code === 20000) {
          const dataRecordsTemp = cloneDeep(data.data);;
          this.listInvoices = dataRecordsTemp; this.loading = false;
        } else {
          this.listInvoices = [];
        }
      })
      .catch(err => {
        this.loading = false;
        console.log("Response Error Catch /warehouse/get_packages", err);
      });
  }
}
interface InvoiceFields {
  id_q_shopee: number;
  create_time: string;
  order_status: string;
  total_amount: number;
  update_time: number | null;
  status: number;
  order_sn: string;
  ship_by_date: string;
}
