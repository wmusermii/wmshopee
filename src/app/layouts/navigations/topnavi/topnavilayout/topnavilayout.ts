import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Topheader } from "../../../directive/topheader/topheader";

@Component({
  standalone: true,
  selector: 'app-topnavilayout',
  imports: [CommonModule, RouterOutlet, Topheader],
  templateUrl: './topnavilayout.html',
  styleUrls: ['./topnavilayout.css']
})
export class Topnavilayout implements OnInit {
    ngOnInit(): void {
        console.log("Topnavilayout Initialized!");
    }
}
