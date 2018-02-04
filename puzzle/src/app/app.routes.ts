import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { ControlPageComponent } from './controlpage.component';
import { MainComponent } from './main.component';

// Route Configuration
export const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'ControlPage/:connectionID/:categoryID', component: ControlPageComponent },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);