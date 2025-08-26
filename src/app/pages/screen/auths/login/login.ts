import { CommonModule, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { Router, RouterModule } from '@angular/router';
import { LocalstorageService } from '../../../../guard/ssr/localstorage/localstorage.service';
@Component({
  standalone:true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule,RouterModule ,ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  ssrStorage = inject(LocalstorageService);
  submitted = false;
  errorMessage:any = {error:false, severity:"info", message:"ini test", icon:"pi pi-times"};
  loading = false;
  loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
  });

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return; // Form invalid, jangan lanjut
    }
    this.loading = true;
    const objPayload = this.loginForm.value;
    console.log("Payload form ", objPayload);
    // const payload = {credential:btoa(`${objPayload.username}:${objPayload.password}`)}
    const credential = btoa(`${objPayload.username}:${objPayload.password}`);
    fetch('/v2/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    })
      .then(res => {
        console.log("Response dari API ", res);
        // logInfo
        if (!res.ok) throw new Error('Login gagal');
        return res.json();
      })
      .then(data => {
        // console.log("Response dari API DATA ", JSON.parse(data));
        console.log("Response dari API DATA ", data);
        this.loading=false;
        if(data.code === 20000) {
          this.ssrStorage.setItem('token', data.data.token);
          this.ssrStorage.setItem('C_INFO', data.data.userinfo);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = {error:true, severity:"error", message:`${data.message}`, icon:"pi pi-times"}
        }
      })
      .catch(err => {
        console.log("Response Error ", err);
        // alert('Login gagal: ' + err.message);
        this.errorMessage = {error:true, severity:"error", message:`${err}`, icon:"pi pi-times"}
      });
  }

  // Helper getter untuk akses kontrol form di template
  get f() {
    return this.loginForm.controls;
  }
  constructor(private router: Router){}
  _changeError(){
    this.errorMessage={error:false, severity:"info", message:"", icon:"pi pi-send"};
  }
}
