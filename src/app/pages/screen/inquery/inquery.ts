import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { cloneDeep } from 'lodash';
@Component({
  standalone: true,
  selector: 'app-inquery',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule, SelectModule, TableModule, DatetimeComponent],
  templateUrl: './inquery.html',
  styleUrl: './inquery.css'
})
export class Inquery implements OnInit {
  userInfo: any | undefined;
  date: Date | undefined;
  optionFromTime: TimeCombo[] | undefined
  fromtime: Date | undefined;
  totime: Date | undefined;
  value: string | undefined;
  selectedResi: any;
  //################################
  showGenerateDialog: boolean = false;
  showProcessResiDialog: boolean = false;
  showProcedPostDialog: boolean = false;
  showErrorDialog: boolean = false;
  ssrStorage = inject(LocalstorageService);
  submitted = false;
  QueriesData: QueryFields[] = [];
  QueriesDataPos: QueryFields[] = [];
  cols!: Column[];
  errorMessage: any = { error: false, severity: "info", message: "ini test", icon: "pi pi-times" };
  loading = false;
  token: string | null | undefined = undefined;
  dateForm = new FormGroup({
    date: new FormControl(new Date(), [Validators.required]),
    fromtime: new FormControl('', [Validators.required]),
    totime: new FormControl('', [Validators.required])
  });
  constructor(private fb: FormBuilder) {
    this.dateForm.get('date')?.valueChanges.subscribe((selectedDate) => {
      this.updateDateTime(selectedDate);
    });

    // Inisialisasi waktu saat pertama render
    this.updateDateTime(this.dateForm.value.date!);
  }
  ngOnInit(): void {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    this.optionFromTime = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      const time = `${hour}:00:01`;
      return { value: time, label: time };
    });
    this.cols = [
      { field: 'id', header: '#', class: "text-center", cellclass: "text-end" },
      { field: 'status', header: 'STATUS', class: "text-center", cellclass: "text-center" },
      { field: 'datepick', header: 'DATE', class: "text-center", cellclass: "text-center" },
      { field: 'fromtime', header: 'FROM TIME', class: "text-center", cellclass: "text-center" },
      { field: 'totime', header: 'TO TIME', class: "text-center", cellclass: "text-center" },
      { field: 'totalresi', header: 'INVOICES', class: "text-center", cellclass: "text-center" },
      { field: 'fullname', header: 'CREATED_BY', class: "text-center", cellclass: "text-start" },
      { field: 'created_at', header: 'CREATED_AT', class: "text-center", cellclass: "text-center" },
    ];
    this.QueriesData = [
    ]

    this.updateDateTime(new Date());
    this._getDailyPorcess();
  }
  // Helper getter untuk akses kontrol form di template
  get f() {
    return this.dateForm?.controls;
  }
  onSubmit() {
    this.submitted = true;
    if (this.dateForm.invalid) {
      return; // Form invalid, jangan lanjut
    }
    if (this.isTimeConflict()) {
      // alert("⛔ Waktu yang Anda generate berada pada rentang waktu yang sudah ada!");
      this.showErrorDialog = true;
      return;
    }



    // this.loading = true;
    console.log("Payload dateform ", this.dateForm.value);
    this.showGenerateDialog = true;
  }

  //######################## TIME FUNCTION ##########################
  updateDateTime(date: Date | null) {
    if (!date) return;

    const now = new Date();
    const currentHour = now.getHours();
    const base = this.optionFromTime?.find(opt => opt.value.startsWith(this.pad(currentHour)));

    if (base) {
      this.dateForm.patchValue({ fromtime: base.value }, { emitEvent: false });
      this.updateToTime(base.value);
    }
  }

  updateToTime(fromValue: any) {
    const value = typeof fromValue === 'string' ? fromValue : fromValue?.value;

    if (!value) return;

    const [hourStr, minuteStr, secondStr] = value.split(':');
    const baseDate = new Date();
    baseDate.setHours(+hourStr, +minuteStr, +secondStr, 0);

    const toDate = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000); // +3 jam

    const time = `${this.pad(toDate.getHours())}:${this.pad(toDate.getMinutes())}:${this.pad(toDate.getSeconds())}`;
    this.dateForm.patchValue({ totime: time }, { emitEvent: false });
  }
  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
  async confirmGenerate() {
    this.showGenerateDialog = false;
    this.loading = true;
    await this._generatePorcess(this.dateForm.value)
  }
  async confirmJobsProcess() {
    this.showProcessResiDialog = false;
    this.loading = true;
    await this._generateJobProcess();
    // await this._generatePorcess(this.dateForm.value)
  }
  cancelGenerate() {
    this.showGenerateDialog = false;
    this.showErrorDialog = false;
  }
  cancelError() {
    this.showErrorDialog = false;
  }
  async _generatePorcess(payload: any) {
    fetch('/v2/shopee/gen_qshopee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API /shopee/gen_qshopee 0", res);
        if (!res.ok) throw new Error('q_shopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/gen_qshopee 1", data);
        if (data.code === 20000) {
          // const dataRecords = data.data;
          const dataRecordsTemp = cloneDeep(data.data);;
          dataRecordsTemp.forEach((record: { status: number | string }) => {
            if (record.status === 0) {
              record.status = 'OPEN';
            } else if (record.status === 1) {
              record.status = 'PROCEED';
            } else {
              record.status = 'UNKNOWN';
            }
          });
          this.QueriesData = dataRecordsTemp;
          this.loading = false;
        } else {
          this.loading = false
          // this.listMenu = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/gen_qshopee", err);
        // this.showConfirmDialog = true;
      });
  }
  async _generateJobProcess() {
    fetch('/v2/shopee/gen_qshopee_job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(this.selectedResi)
    })
      .then(res => {
        console.log("Response dari API /shopee/gen_jobs_qshopee 0", res);
        if (!res.ok) throw new Error('gen_jobs_qshopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/gen_jobs_qshopee 1", data);
        if (data.code === 20000) {
          const dataRecordsTemp = cloneDeep(data.data);;
          dataRecordsTemp.forEach((record: { status: number | string }) => {
            if (record.status === 0) {
              record.status = 'OPEN';
            } else if (record.status === 1) {
              record.status = 'PROCEED';
            } else {
              record.status = 'UNKNOWN';
            }
          });
          this.QueriesData = dataRecordsTemp;
          this.loading = false;

        } else {
          this.loading = false
          // this.listMenu = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/gen_qshopee", err);
        // this.showConfirmDialog = true;
      });
  }

  async _getDailyPorcess() {
    fetch('/v2/shopee/get_qshopee', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /shopee/get_qshopee", res);
        if (!res.ok) throw new Error('get QShopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/get_qshopee ", data);
        if (data.code === 20000) {
          const dataRecordsTemp = cloneDeep(data.data);;
          dataRecordsTemp.forEach((record: { status: number | string }) => {
            if (record.status === 0) {
              record.status = 'OPEN';
            } else if (record.status === 1) {
              record.status = 'PROCEED';
            } else {
              record.status = 'UNKNOWN';
            }
          });
          this.QueriesData = dataRecordsTemp;
        } else {
          this.QueriesData = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/get_qshopee", err);
      });
  }
  async _getViewPosProcess(payload:any) {
    fetch('/v2/shopee/get_positem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        console.log("Response dari API  /shopee/get_positem", res);
        if (!res.ok) throw new Error('get QShopee Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /shopee/get_positem ", data);
        this.loading=false;
        if (data.code === 20000) {
          this.showProcedPostDialog = true;
          const dataRecordsTemp = cloneDeep(data.data);
          console.log("Data View ", dataRecordsTemp.data);
          this.QueriesDataPos = dataRecordsTemp.data;
        } else {
          this.QueriesDataPos = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/get_qshopee", err);
      });
  }
  isTimeConflict(): boolean {
    const inputFrom = this.dateForm.get('fromtime')?.value;
    const inputTo = this.dateForm.get('totime')?.value;

    if (!inputFrom || !inputTo) return false;

    const inputFromSec = this.timeToSeconds(inputFrom);
    const inputToSec = this.timeToSeconds(inputTo);

    return this.QueriesData.some(record => {
      const recordFromSec = this.timeToSeconds(record.fromtime);
      const recordToSec = this.timeToSeconds(record.totime);

      // Cek overlap
      const isSameDate = record.datepick === this.dateForm.get('date')?.value?.toISOString().slice(0, 10);
      return isSameDate && (inputFromSec < recordToSec && inputToSec > recordFromSec);
    });
  }

  timeToSeconds(time: string): number {
    const [h, m, s] = time.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  }
  _processRow(rowData: any) {
    console.log(rowData);
    this.showProcessResiDialog = true;
    this.selectedResi = rowData
  }

   async _viewPostItem(rowData: any) {
    console.log("Melihat Post Barang yang di beli",rowData);
    const payload = {id:rowData.id};
    this.loading= true;
    await this._getViewPosProcess(payload);
   }
   async _backtojob(){
      this.showProcedPostDialog=false;
   }

  _cancelProcessRow() {
    this.showProcessResiDialog = false;
  }
}
interface TimeCombo {
  value: string;
  label: string;
}
interface QueryFields {
  id: number;
  fromtime: string;
  totime: string;
  created_by: string;
  created_at: string;
  datepick: string;
  remarks: string;
}
interface Column {
  field: string;
  header: string;
  class: string;
  cellclass: string;
}
