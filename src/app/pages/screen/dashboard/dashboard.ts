import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule,FormsModule, ButtonModule, InputTextModule,DatePickerModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {
     date: Date | undefined;
    value:string | undefined;
}
