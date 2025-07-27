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

@Component({
  standalone: true,
  selector: 'app-inquery',
  imports: [CommonModule, ReactiveFormsModule ,FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule,SelectModule,TableModule, DatetimeComponent],
  templateUrl: './inquery.html',
  styleUrl: './inquery.css'
})
export class Inquery implements OnInit {
  userInfo:any | undefined;
  date: Date | undefined;
  optionFromTime:TimeCombo[] | undefined
  fromtime: Date | undefined;
  totime: Date | undefined;
  value: string | undefined;
  //################################
  showGenerateDialog:boolean = false;
  ssrStorage = inject(LocalstorageService);
  submitted = false;
  QueriesData:QueryFields[]=[];
  cols!: Column[];
  errorMessage:any = {error:false, severity:"info", message:"ini test", icon:"pi pi-times"};
  loading = false;
  token: string | null | undefined = undefined;
  dateForm = new FormGroup({
      date: new FormControl(new Date(), [Validators.required]),
      fromtime: new FormControl('', [Validators.required]),
      totime: new FormControl('', [Validators.required])});
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
            { field: 'id', header: '#', class:"text-center", cellclass:"text-end" },
            { field: 'datepick', header: 'DATE', class:"text-center", cellclass:"text-center" },
            { field: 'fromtime', header: 'FROM TIME', class:"text-center", cellclass:"text-center" },
            { field: 'totime', header: 'TO TIME', class:"text-center", cellclass:"text-center" },
            { field: 'fullname', header: 'CREATED_BY', class:"text-center", cellclass:"text-start" },
            { field: 'created_at', header: 'CREATED_AT', class:"text-center", cellclass:"text-center" },
    ];
    this.QueriesData = [
      // {
      //   id: 1, datepick: "2025-07-10", fromtime: "02:00:01", totime: "05:00:00", created_by: "system", created_at: '2025-07-10',
      //   remarks: 'Generated Shopee Request'
      // },
      // {
      //   id: 2, datepick: "2025-07-10", fromtime: "05:00:01", totime: "09:00:00", created_by: "system", created_at: '2025-07-10',
      //   remarks: 'Generated Shopee Request'
      // },
      // {
      //   id: 3, datepick: "2025-07-10", fromtime: "09:00:01", totime: "12:00:00", created_by: "system", created_at: '2025-07-10',
      //   remarks: 'Generated Shopee Request'
      // },
    ]
  //   {
  //   "id": 2,
  //   "datepick": "2025-07-24",
  //   "fromtime": "22:00:01",
  //   "totime": "01:00:01",
  //   "created_by": "102345690",
  //   "fullname": "Super Admin",
  //   "created_at": "2025-07-24 15:37:45"
  // }
    this.updateDateTime(new Date());
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
  async confirmGenerate(){
    this.showGenerateDialog = false;
    this.loading = true;
    await this._generatePorcess(this.dateForm.value)
  }
  cancelGenerate(){
    this.showGenerateDialog=false;
  }
  async _generatePorcess(payload:any) {
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
          const dataRecords = data.data;
          this.QueriesData=dataRecords;
          // const datamenuString = data.data.menublob;
          // if (datamenuString) {
          //   this.listMenu = JSON.parse(datamenuString);
          //   this.replaceLogoutWithCommand.call(this,this.listMenu);
          // }
          this.loading=false;

        } else {
          this.loading=false
          // this.listMenu = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /shopee/gen_qshopee", err);
        // this.showConfirmDialog = true;
      });
  }
  async _getDailyPorcess() {
    fetch('/v2/auth/attrb', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /auth/attrb", res);
        if (!res.ok) throw new Error('Attrb Gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API /auth/attrb ", data);
        if (data.code === 20000) {
          // const datamenuString = data.data.menublob;
          // if (datamenuString) {
          //   this.listMenu = JSON.parse(datamenuString);
          //   this.replaceLogoutWithCommand.call(this,this.listMenu);
          // }
        } else {
          // this.listMenu = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /auth/attrb", err);
        // this.showConfirmDialog = true;
      });
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
    remarks:string;
}
interface Column {
    field: string;
    header: string;
    class: string;
    cellclass:string;
}
