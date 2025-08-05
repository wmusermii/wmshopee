import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { Subject } from 'rxjs';

@Component({
  standalone:true,
  selector: 'app-registration',
  imports: [CommonModule, FormsModule,ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule],
  templateUrl: './registration.html',
  styleUrl: './registration.css'
})
export class Registration {
  errorRegistration:any={error:false, message:"Error Message", title:"Error!"}
  successRegistration:any={success:false, message:"Registration Success", title:"Success!"}
  registerForm = new FormGroup({
      fullname: new FormControl('', [Validators.required]),
      mobilename: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required]),
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', [Validators.required]),
      groupCode: new FormControl('', [Validators.required]),
  });


// Helper getter untuk akses kontrol form di template
  get f() {
    return this.registerForm.controls;
  }
constructor() {}
loading = false;


onRegister() {
  if (this.registerForm.valid) {
    console.log('Register data:', this.registerForm.value);
    // TODO: Implementasi submit ke backend
  }
}

onCancel() {
  this.registerForm.reset();
}
onSubmit() {
  this.loading=true;
  const htmlMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>User Registration</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f4f6f8; color:#333; margin:0; padding:0; }
  .container { max-width:480px; background:#fff; margin:40px auto; border-radius:8px; padding:30px 40px; box-shadow:0 4px 16px rgba(0,0,0,0.1); }
  h1 { color:#007bff; margin-bottom:20px; font-weight:700; font-size:24px; }
  .content { font-size:16px; line-height:1.6; }
  .credential-box { background:#f1f5fb; border:1px solid #d1e2ff; border-radius:6px; padding:15px 20px; margin:20px 0; font-family: 'Courier New', Courier, monospace; font-size:15px; color:#1a237e; }
  .footer { font-size:14px; color:#777; margin-top:30px; text-align:center; }
</style>
</head>
<body>
<div class="container">
  <h1>User Registration</h1>
  <div class="content">
    <p>Your credential is:</p>
    <div class="credential-box">
      <p><strong>User ID :</strong> User Name</p>
      <p><strong>Password :</strong> aslkdnfa;sPOPOMP</p>
    </div>
    <p>Please change the password after you are logged in.</p>
  </div>
  <div class="footer">
    <p>Thank you for registering with us!</p>
  </div>
</div>
</body>
</html>
`;
  const payload= {to:"wmusermii@gmail.com", subject:"User Registration", message:htmlMessage}

   fetch('/v2/warehouse/send_email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
//         {
//     "code": 20000,
//     "message": "Email sent successfully",
//     "data": {
//         "messageId": "<65eb6fee-81a5-cb3c-1a99-7bf67ac85386@gmail.com>"
//     }
// }
        this.successRegistration={success:true, message:`Registration Success and ${data.message}`, title:"Success Register!"};
      })
      .catch(err => {
        console.log("Response Error ", err);
        this.loading=false;
        this.errorRegistration={error:true, message:err.message, title:"Error!"};
        // alert('Login gagal: ' + err.message);
        // this.errorMessage = {error:true, severity:"error", message:`${err}`, icon:"pi pi-times"}
      });




}
async cancelError(){
  this.errorRegistration={error:false, message:"Error Message", title:"Error!"};
}
async cancelSuccess(){
  this.successRegistration={success:false, message:"Registration Success", title:"Success!"};
}

}
