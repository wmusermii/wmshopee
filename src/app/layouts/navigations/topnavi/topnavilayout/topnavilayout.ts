import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-topnavilayout',
  imports: [CommonModule, RouterOutlet,RouterLink],
  templateUrl: './topnavilayout.html',
  styleUrls: ['./topnavilayout.css']
})
export class Topnavilayout implements OnInit {
    ngOnInit(): void {
        console.log("Topnavilayout Initialized!");
    }
}
