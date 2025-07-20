import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',redirectTo: 'login',pathMatch: 'full'
  },
  {path:'',
    loadComponent:() => import("./layouts/navigations/nonavi/nonavi").then(m => m.Nonavi),
    children:[
      {path:'login',loadComponent:() => import("./pages/screen/auths/login/login").then(m => m.Login)},

    ]
  }
];
//  {
//     path: '',redirectTo: 'dashboard',pathMatch: 'full'
//   },
//   {path:'',
//     loadComponent:() => import("./layouts/navigations/topnavi/topnavilayout/topnavilayout").then(m => m.Topnavilayout),
//     children:[
//       {path:'dashboard',loadComponent:() => import("./pages/screen/dashboard/dashboard").then(m => m.Dashboard)},
//       {path:'about',loadComponent:() => import("./pages/screen/about/about").then(m => m.About)},
//     ]
//   }
