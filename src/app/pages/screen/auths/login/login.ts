import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { Router } from '@angular/router';
@Component({
  standalone:true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule,ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
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
    console.log("Payload form ", this.loginForm.value);
    fetch('/v2/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.loginForm.value)
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
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = {error:true, severity:"error", message:`${data.message}`, icon:"pi pi-times"}
        }
      })
      .catch(err => {
        console.log("Response Error ", err);
        alert('Login gagal: ' + err.message);
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
