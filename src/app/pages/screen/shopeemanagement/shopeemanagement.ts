import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';

@Component({
  standalone: true,
  selector: 'app-shopeemanagement',
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, DatetimeComponent, InputGroupModule, InputTextModule, InputGroupAddonModule, ButtonModule, TableModule, SelectModule, ChipModule, DatePickerModule],
  templateUrl: './shopeemanagement.html',
  styleUrl: './shopeemanagement.css'
})
export class Shopeemanagement implements OnInit {
  userInfo: any | undefined;
  date: Date | undefined;
  value: string | undefined;
  loading: boolean = false;
  token: string | null | undefined = undefined;

  shopeeAttrForm = new FormGroup({
    access_token: new FormControl('', [Validators.required]),
    refresh_token: new FormControl('', [Validators.required]),
    shop_id: new FormControl('', [Validators.required]),
    code: new FormControl('', [Validators.required]),
    client_id: new FormControl('', [Validators.required]),
    client_secret: new FormControl('', [Validators.required]),
    redirect_uri: new FormControl('', [Validators.required]),
    base_api: new FormControl('', [Validators.required]),
  });
  // Helper getter untuk akses kontrol form di template
  get f() {
    return this.shopeeAttrForm.controls;
  }
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  async ngOnInit(): Promise<void> {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    await this._refreshAttribute()
  }

  async _refreshAttribute(): Promise<void> {
    this.loading = true;
    fetch('/v2/shopee/get_attributes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    })
      .then(res => {
        console.log("Response dari API  /shopee/get_attributes", res);
        if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
        return res.json();
      })
      .then(async data => {
        console.log("Response dari API /shopee/get_attributes", data);
        if (data.code === 20000) {
          const updatedWH = data.data;
          this.loading=false;
          this.shopeeAttrForm.patchValue({
              access_token: updatedWH.access_token,
              refresh_token: updatedWH.refresh_token,
              shop_id: updatedWH.shop_id,
              code: updatedWH.code,
              client_id: updatedWH.client_id,
              client_secret: updatedWH.client_secret,
              redirect_uri:updatedWH.redirect_uri,
              base_api: updatedWH.base_api
          });
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
  async _updateAttribute(payload: any) {
    this.loading = true;
    fetch('/v2/shopee/update_attributes', {
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
        if (data.code === 20000) {
          // this.showGenerateDialog=false;
          await this._refreshAttribute();
        } else {
          this.loading = false;
          // this.errorMessage = {error:true, severity:"error", message:`${data.message}`, icon:"pi pi-times"}
        }
      })
      .catch(err => {
        console.log("Response Error ", err);
        // alert('Login gagal: ' + err.message);
        // this.errorMessage = {error:true, severity:"error", message:`${err}`, icon:"pi pi-times"}
      });
  }
  onCancel() {
    // this.registerForm.reset();
  }
  async onSubmit() {
      console.log("Payload ", this.shopeeAttrForm.value);
      this.loading= true;
      // {
      //     "access_token": "eyJhbGciOiJIUzI1NiJ9.CKbmehABGMPA4zggASieisXFBjD66NoVOAFAAQ._u9JPUw0it2JTXA9lD-aF7xlztAI00sLhcROYbKJHFc",
      //     "refresh_token": "eyJhbGciOiJIUzI1NiJ9.CKbmehABGMPA4zggAiieisXFBjDk8d2TCTgBQAE.6qOudd_04cGbzoRL-RNRpCAq1uexBgIPr7a0Eh0VhPg",
      //     "shop_id": "119070787",
      //     "code": "6169496d4c6a4d72684a615475574842",
      //     "client_id": "2011942",
      //     "client_secret": "shpk6e44424a53644f786f636a62434741496d6e4944454d566e526e5a654a63",
      //     "redirect_uri": "https://muktiryan.github.io/shopee-oauth-redirect/",
      //     "base_api": "https://partner.shopeemobile.com"
      // }
      if(this.shopeeAttrForm.valid) await this._updateAttribute(this.shopeeAttrForm.value);
  }
}
