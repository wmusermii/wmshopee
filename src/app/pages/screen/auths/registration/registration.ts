import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
// import { Subject } from 'rxjs';

@Component({
  standalone:true,
  selector: 'app-registration',
  imports: [CommonModule, FormsModule,ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule, SelectModule],
  templateUrl: './registration.html',
  styleUrl: './registration.css'
})
export class Registration {
  errorRegistration:any={error:false, message:"Error Message", title:"Error!"}
  successRegistration:any={success:false, message:"Registration Success", title:"Success!"}
  optiongroup:any[]=[
    {
      code:'100000000002', label:'Supervisor', description:'Oversees the work of others, guiding and managing a team to ensure tasks are completed effectively'
    },
    {
      code:'100000000003', label:'Spv Product', description:'Oversees the products, operating to ensure product inventory are completly adjust'
    },
    {
      code:'100000000004', label:'Spv Warehouse', description:'Oversees the stores and warehouses status, and complete product disposition'
    },
    {
      code:'100000000005', label:'Packager', description:'Responsible for the invoices and items requested checked!'
    }
  ]
  registerForm = new FormGroup({
      fullname: new FormControl('', [Validators.required]),
      mobilename: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required]),
      username: new FormControl('', [Validators.required]),
      password: new FormControl(''),
      groupCode: new FormControl('', [Validators.required]),
  });


// Helper getter untuk akses kontrol form di template
  get f() {
    return this.registerForm.controls;
  }
constructor(private router: Router) {}
loading = false;


onRegister() {
  if (this.registerForm.valid) {
    console.log('Register data:', this.registerForm.value);
//     {
//     "fullname": "Ryan Muktiadhi",
//     "mobilename": "087872195524",
//     "email": "wmusermii@gmail.com",
//     "username": "ryanmu",
//     "password": "",
//     "groupCode": {
//         "code": "100000000002",
//         "label": "Supervisor",
//         "description": "Oversees the work of others, guiding and managing a team to ensure tasks are completed effectively"
//     }
// }
    // TODO: Implementasi submit ke backend
  }
}

onCancel() {
  this.registerForm.reset();
}
onSubmit() {

  if(this.registerForm.valid)
  {
    console.log("Value nya ", this.registerForm.value);
  }
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
  // const payload= {to:"wmusermii@gmail.com", subject:"User Registration", message:htmlMessage}
   fetch('/v2/auth/registuser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.registerForm.value)
    })
      .then(res => {
        console.log("Response dari API ", res);
        if (!res.ok) throw new Error('Login gagal');
        return res.json();
      })
      .then(data => {
        console.log("Response dari API DATA ", data);
        this.loading=false;
        if(data.code === 20000) {
          this.successRegistration={success:true, message:`Registration Success and ${data.message}`, title:"Success Register!"};
        } else {
          this.errorRegistration={error:true, message:data.message, title:"Error Registration!"};
        }
      })
      .catch(err => {
        console.log("Response Error ", err);
        this.loading=false;
        this.errorRegistration={error:true, message:err.message, title:"Error!"};
      });
  //  fetch('/v2/warehouse/send_email', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload)
  //   })
  //     .then(res => {
  //       console.log("Response dari API ", res);
  //       // logInfo
  //       if (!res.ok) throw new Error('Login gagal');
  //       return res.json();
  //     })
  //     .then(data => {
  //       console.log("Response dari API DATA ", data);
  //       this.loading=false;
  //       this.successRegistration={success:true, message:`Registration Success and ${data.message}`, title:"Success Register!"};
  //     })
  //     .catch(err => {
  //       console.log("Response Error ", err);
  //       this.loading=false;
  //       this.errorRegistration={error:true, message:err.message, title:"Error!"};
  //     });




}
async cancelError(){
  this.errorRegistration={error:false, message:"Error Message", title:"Error!"};
  // this.router.navigate(['/login']);
}
async cancelSuccess(){
  this.successRegistration={success:false, message:"Registration Success", title:"Success!"};
  this.router.navigate(['/dashboard']);
}

}
