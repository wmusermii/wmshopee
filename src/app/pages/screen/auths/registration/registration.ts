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
    },
    {
      code:'100000000006', label:'Spv Packager', description:'Responsible for the invoices and items requested checked!'
    },
    {
      code:'100000000007', label:'Operator', description:'Responsible for anything!'
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
