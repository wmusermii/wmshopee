import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
//######################### PRIMENG ##############################
import { MenubarModule } from 'primeng/menubar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@Component({
  standalone:true,
  selector: 'app-topheader',
  imports: [CommonModule,FormsModule,RouterModule ,ReactiveFormsModule, RouterModule, MenubarModule, PanelMenuModule, ButtonModule],
  templateUrl: './topheader.html',
  styleUrl: './topheader.css'
})
export class Topheader implements OnInit, OnDestroy {
  loading: boolean = false;
  token: string | null | undefined = undefined;
  dropdownClicked = false;
  openDropdownId: string | null = null;
  showLogoutDialog = false;
  showConfirmDialog = false;
  isMobileMenuOpen = false;
  items: MenuItem[] | undefined;
  listMenu: any[] = [];
  message: any = { title: "Expired Session", icon: "pi pi-exclamation-circle", message: "EXP token please login again." }
  // Simulasi status login user (ganti sesuai logika aplikasi Anda)
  isUserLoggedIn = false;
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  ngOnInit(): void {
    this.token = this.ssrStorage.getItem('token')
    if (!this.token) {
      // console.log("TOKEN KOSONG : ", this.token);
      this.router.navigate(['/login']);
    } else {
      // console.log("TOKEN ISI : ", "this.token");
      this._getAttribute()
    }
  }
  ngOnDestroy(): void {
    // throw new Error('Method not implemented.');
  }
  async _getAttribute() {
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
          const datamenuString = data.data.menublob;
          if (datamenuString) {
            this.listMenu = JSON.parse(datamenuString);
            this.replaceLogoutWithCommand.call(this,this.listMenu);
          }
        } else {
          this.listMenu = [];
        }
      })
      .catch(err => {
        console.log("Response Error Catch /auth/attrb", err);
        this.showConfirmDialog = true;
      });
  }
  // helper recursive function
  async replaceLogoutWithCommand(items: any[]) {
    for (const item of items) {
      if (item.label === 'Logout') {
        delete item.routerLink;
        item.command = () => {
          console.log('Logout clicked');
          this.openLogoutDialog();
          // Panggil method logout
          // this.logout(); // pastikan this mengacu ke komponen (lihat penjelasan di bawah)
        };
      }

      if (item.items) {
        this.replaceLogoutWithCommand(item.items);
      }
    }
  }
  openLogoutDialog() {
    console.log("LOGING OUT");
    this.showLogoutDialog = true;
  }
  toggleMobileMenu() {
    console.log("Toggle Menu mobile ",this.isMobileMenuOpen);
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  openConfirmDialog() {
    console.log("LOGING OUT");
    this.showLogoutDialog = true;
  }
  closeDropdown() {
    this.openDropdownId = null;
    this.isMobileMenuOpen=false;
  }
  cancelLogout() {
    this.showLogoutDialog = false;
  }

  async confirmLogout() {
    this.loading = true;
    this.showLogoutDialog = false;
    this.showConfirmDialog = false;
    try {
      await this.ssrStorage.clear();
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 50);
    } catch (error) {
      console.error('Error saat clear storage:', error);
      // Tetap navigasi meskipun error
      this.router.navigate(['/login']);
    }
  }
}
