import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { LocalstorageService } from '../../../guard/ssr/localstorage/localstorage.service';
import { Router } from '@angular/router';

@Component({
  standalone:true,
  selector: 'app-datetime',
  imports: [CommonModule],
  templateUrl: './datetime.component.html',
  styleUrls: ['./datetime.component.scss']
})
export class DatetimeComponent implements OnInit, OnDestroy {
  token: string | null | undefined = undefined;
  loading:boolean = false;
   intervalId?: any;
  currentDateTime = '';
  nilaiPerformance:string = "Undefined"
  storeTitle:string = "Undefined"
  // constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  constructor(private router: Router, private ssrStorage: LocalstorageService) { }
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  async ngOnInit(): Promise<void> {
    this.token = this.ssrStorage.getItem('token');
    // this.updateDateTime();
    // if (isPlatformBrowser(this.platformId)) {
    //   setInterval(() => this.updateDateTime(), 1000);
    // }
    await this._refreshShopPerformance();
    await this._refreshShopInfo();
  }
  updateDateTime() {
    // console.log("UPDATE Date Time");
    const now = new Date();
    this.currentDateTime = now.toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  }
  async _refreshShopPerformance() {
    this.loading = true;
        fetch('/v2/shopee/get_shop_performance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          }
        })
          .then(res => {
            console.log("Response dari API  /shopee/get_shop_performance", res);
            if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
            return res.json();
          })
          .then(async data => {
            console.log("Response dari API /shopee/get_shop_performance", data);
            if(data.code === 20000 && data.data){
              const perfomanumber = data.data.rating
              this.nilaiPerformance = await this.getPerformance(perfomanumber)
            }
          })
          .catch(err => {
            this.loading = false;
            console.log("Response Error Catch /shopee/get_shop_performance", err);
          });
  }
  async _refreshShopInfo() {
    this.loading = true;
        fetch('/v2/shopee/get_shop_info', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          }
        })
          .then(res => {
            console.log("Response dari API  /shopee/get_shop_info", res);
            if (!res.ok) throw new Error('get QShopee Gagal'); this.loading = false;
            return res.json();
          })
          .then(data => {
            console.log("Response dari API /shopee/get_shop_info", data);
            if(data.code === 20000 && data.data) {
              this.storeTitle = data.data.shop_name
            }
          })
          .catch(err => {
            this.loading = false;
            console.log("Response Error Catch /shopee/get_shop_info", err);
          });
  }
  async getPerformance(status: number) {
    switch (status) {
      case 1:
        return 'Poor';
      case 2:
        return 'ImprovementNeeded';
      case 3:
        return 'Good';
      case 4:
        return 'Excellent';
      default:
        return 'Undefined';
    }
  }
}

