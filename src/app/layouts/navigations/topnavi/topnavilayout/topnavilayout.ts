import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-topnavilayout',
  imports: [CommonModule, RouterOutlet,RouterLink],
  templateUrl: './topnavilayout.html',
  styleUrl: './topnavilayout.css'
})
export class Topnavilayout implements OnInit {
    ngOnInit(): void {
        console.log("Topnavilayout Initialized!");
    }
}
