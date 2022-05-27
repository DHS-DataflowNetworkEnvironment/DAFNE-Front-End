import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainViewComponent } from './main-view/main-view.component';
import { NetworkViewComponent } from './MAIN_VIEW_ITEMS/network-view/network-view.component';
import { LoginComponent } from './login/login.component';
import { CompletenessComponent } from './MAIN_VIEW_ITEMS/completeness/completeness.component';
import { PublicationLatencyComponent } from './MAIN_VIEW_ITEMS/publication-latency/publication-latency.component';
import { AuthGuard } from './util/auth.guard';
import { EditCentresComponent } from './edit-centres/edit-centres.component';
import { EditServicesComponent } from './edit-services/edit-services.component';
import { EditSyncComponent } from './edit-sync/edit-sync.component';
import { ServiceAvailabilityComponent } from './MAIN_VIEW_ITEMS/service-availability/service-availability.component';

const routes: Routes = [
  /* Main routes */
  { path: 'dafne-login', component: LoginComponent, runGuardsAndResolvers: 'always'},
  { path: 'gui', component: MainViewComponent, canActivate: [AuthGuard] , runGuardsAndResolvers: 'always'
    , children: [
      /* Auxiliary routes */
      { path: 'network-component/:mapType', outlet: 'centralBodyRouter', component: NetworkViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'completeness-component', outlet: 'centralBodyRouter', component: CompletenessComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'publication-latency-component', outlet: 'centralBodyRouter', component: PublicationLatencyComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'service-availability', outlet: 'centralBodyRouter', component: ServiceAvailabilityComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: '', outlet: 'centralBodyRouter', component: NetworkViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'}
    ]
  },
  { path: 'edit-centres', component: EditCentresComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
  { path: 'edit-services', component: EditServicesComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
  { path: 'edit-synchronizers', component: EditSyncComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
  { path: '', redirectTo: 'gui', pathMatch: 'full'},
  { path: '**', redirectTo: 'gui'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }