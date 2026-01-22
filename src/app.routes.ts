
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  {
    path: 'patients',
    canActivate: [authGuard],
    loadComponent: () => import('./components/patients/patient-list.component').then(c => c.PatientListComponent)
  },
  {
    path: 'patients/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/patients/patient-detail.component').then(c => c.PatientDetailComponent)
  },
  {
    path: 'appointments',
    canActivate: [authGuard],
    loadComponent: () => import('./components/appointments/appointment-list.component').then(c => c.AppointmentListComponent)
  },
  {
    path: 'procedures',
    canActivate: [authGuard],
    loadComponent: () => import('./components/procedures/procedure-chart.component').then(c => c.ProcedureChartComponent)
  },
  {
    path: 'imaging',
    canActivate: [authGuard],
    loadComponent: () => import('./components/imaging/imaging-study.component').then(c => c.ImagingStudyComponent)
  },
  {
    path: 'webhooks',
    canActivate: [authGuard],
    loadComponent: () => import('./components/webhooks/webhook-demo.component').then(c => c.WebhookDemoComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
