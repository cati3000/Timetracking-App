import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TimeTrackingComponent } from './features/time-tracking/time-tracking.component';
import { PtoComponent } from './features/pto/pto.component';
import { LogFilterComponent } from './features/log-filter/log-filter.component';

const routes: Routes = [
  { path: 'time-tracking', component: TimeTrackingComponent },
  { path: 'pto', component: PtoComponent },
  { path: 'log-filter', component: LogFilterComponent },
  { path: '', redirectTo: '/time-tracking', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }