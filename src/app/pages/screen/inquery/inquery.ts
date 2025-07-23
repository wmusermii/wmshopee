import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { DatetimeComponent } from '../../../layouts/directive/datetime/datetime.component';

@Component({
  standalone: true,
  selector: 'app-inquery',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, ChipModule, DatetimeComponent],
  templateUrl: './inquery.html',
  styleUrl: './inquery.css'
})
export class Inquery implements OnInit {

  date: Date | undefined;
  fromtime: Date | undefined;
  totime: Date | undefined;
  value: string | undefined;

  ngOnInit(): void {

  }
}
