import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';

@Component({
  standalone:true,
  selector: 'app-myprofile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule, SelectModule, TableModule, DatetimeComponent,CheckboxModule,PasswordModule],
  templateUrl: './myprofile.html',
  styleUrl: './myprofile.css'
})
export class Myprofile implements OnInit {
  userInfo: any | undefined;
  loading = false;
  token: string | null | undefined = undefined;
  ssrStorage = inject(LocalstorageService);
  showErrorDialog: boolean = false;
  errorMessage: any = { error: false, severity: "info", message: "ini test", icon: "pi pi-times" };
  successMessage:any={success:false, message:"Registration Success", title:"Success!"}
  profileForm = new FormGroup({
    iduser: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
    fullname: new FormControl('', [Validators.required]),
    mobile: new FormControl(''),
    email: new FormControl('', [Validators.required]),
    groupname: new FormControl('', [Validators.required]),
    changepassword: new FormControl(false),
    password: new FormControl(''),
    cpassword: new FormControl(''),
  });
  ngOnInit(): void {
    this.token = this.ssrStorage.getItem('token');
    this.userInfo = this.ssrStorage.getItem("C_INFO");
    console.log("USER INFO ", this.userInfo);
    if (this.userInfo) {
      this.profileForm.patchValue({
        iduser: this.userInfo.iduser ?? '',
        username: this.userInfo.username ?? '',
        fullname: this.userInfo.fullname ?? '',
        mobile: this.userInfo.mobile ?? '',
        email: this.userInfo.email ?? '',
        groupname: this.userInfo.groupname ?? '',
      });
    }


  }
  get f() {
    return this.profileForm?.controls;
  }
  onSubmit() {

    const ObjectSubmited:any = this.profileForm.value;
    console.log("Object Value ", this.profileForm.value);
    if (this.profileForm.invalid) {
      return; // Form invalid, jangan lanjut
    }

    if(ObjectSubmited.changepassword) {
      if(ObjectSubmited.password === "") {
        this.errorMessage = { error: true, severity: "error", message: "Password cannot be null value!", icon: "pi pi-times" };return
      }
      if(ObjectSubmited.cpassword === "") {
        this.errorMessage = { error: true, severity: "error", message: "Confirm Password cannot be null value!", icon: "pi pi-times" };return
      }
      if(ObjectSubmited.password !== ObjectSubmited.cpassword) {
        this.errorMessage = { error: true, severity: "error", message: "Password and confirm password is not the same!", icon: "pi pi-times" };return
      }
    }
    this.loading = true;

    fetch('/v2/auth/updateuser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify(ObjectSubmited)
        })
          .then(res => {
            console.log("Response dari API /auth/updateusere 0", res);
            if (!res.ok) throw new Error('q_shopee Gagal');
            return res.json();
          })
          .then(data => {
            console.log("Response dari API /auth/updateuser 1", data);
            if (data.code === 20000) {

              this.loading = false;
              this.successMessage={success:true, message:`Update User succeed!`, title:"Success Register!"};
            } else {
              this.loading = false;
              this.errorMessage = { error: true, severity: "error", message: "Unable update user profile", icon: "pi pi-times" };
            }
          })
          .catch(err => {
            console.log("Response Error Catch /auth/updateuser", err);
          });




    // return;
//     {
//     "iduser": "102345690",
//     "username": "admin",
//     "fullname": "Super Admin",
//     "mobile": "20",
//     "email": "wmusermii@gmail.com",
//     "groupname": "Superadmin",
//     "changepassword": true,
//     "password": "coba",
//     "cpassword": "coba1"
// }
  }
  cancelGenerate(){
    // this.showErrorDialog=false;
    this.errorMessage = { error: false, severity: "info", message: "ini test", icon: "pi pi-times" };
  }
  cancelSuccess() {
    this.successMessage = {success:false, message:"Registration Success", title:"Success!"};
  }
}
