import { Routes } from '@angular/router';

export const routes: Routes = [
  {path:'',
    loadComponent:() => import("./layouts/navigations/topnavi/topnavilayout/topnavilayout").then(m => m.Topnavilayout),
    children:[
      {path:'dashboard',loadComponent:() => import("./pages/screen/dashboard/dashboard").then(m => m.Dashboard)},
      {path:'about',loadComponent:() => import("./pages/screen/about/about").then(m => m.About)},
      {
        path: '',redirectTo: 'dashboard',pathMatch: 'full'
      }
    ]
  }
];
