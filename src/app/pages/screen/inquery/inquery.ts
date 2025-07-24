import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';

@Component({
  standalone: true,
  selector: 'app-inquery',
  imports: [CommonModule, ReactiveFormsModule ,FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule,SelectModule, DatetimeComponent],
  templateUrl: './inquery.html',
  styleUrl: './inquery.css'
})
export class Inquery implements OnInit {

  date: Date | undefined;
  optionFromTime:TimeCombo[] | undefined
  fromtime: Date | undefined;
  totime: Date | undefined;
  value: string | undefined;
  //################################
  showGenerateDialog:boolean = false;
  ssrStorage = inject(LocalstorageService);
  submitted = false;
  errorMessage:any = {error:false, severity:"info", message:"ini test", icon:"pi pi-times"};
  loading = false;
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
    this.optionFromTime = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      const time = `${hour}:00:01`;
      return { value: time, label: time };
    });
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
    // fetch('/v2/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(this.loginForm.value)
    // })
    //   .then(res => {
    //     console.log("Response dari API ", res);
    //     // logInfo
    //     if (!res.ok) throw new Error('Login gagal');
    //     return res.json();
    //   })
    //   .then(data => {
    //     // console.log("Response dari API DATA ", JSON.parse(data));
    //     console.log("Response dari API DATA ", data);
    //     this.loading=false;
    //     if(data.code === 20000) {
    //       this.ssrStorage.setItem('token', data.data.token);
    //       this.router.navigate(['/dashboard']);
    //     } else {
    //       this.errorMessage = {error:true, severity:"error", message:`${data.message}`, icon:"pi pi-times"}
    //     }
    //   })
    //   .catch(err => {
    //     console.log("Response Error ", err);
    //     alert('Login gagal: ' + err.message);
    //   });
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
  confirmGenerate(){
    console.log("Confirm generate");
    this.showGenerateDialog = false;
    this.loading = true;
  }
  cancelGenerate(){
    this.showGenerateDialog=false;
  }
}
interface TimeCombo {
    value: string;
    label: string;
}
