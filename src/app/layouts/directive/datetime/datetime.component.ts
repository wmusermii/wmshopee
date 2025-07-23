import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';

@Component({
  standalone:true,
  selector: 'app-datetime',
  imports: [CommonModule],
  templateUrl: './datetime.component.html',
  styleUrls: ['./datetime.component.scss']
})
export class DatetimeComponent implements OnInit, OnDestroy {
   intervalId?: any;
  currentDateTime = '';
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  ngOnInit(): void {
    this.updateDateTime();
    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => this.updateDateTime(), 1000);
    }

  }
  updateDateTime() {
    console.log("UPDATE Date Time");
    const now = new Date();
    this.currentDateTime = now.toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  }
}
