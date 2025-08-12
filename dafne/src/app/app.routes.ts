import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/util/auth.guard';
import { LoginComponent } from 'src/app/login/login.component';
import { MainViewComponent } from 'src/app/main-view/main-view.component';
import { NetworkViewComponent } from 'src/app/MAIN_VIEW_ELEMENTS/network-view/network-view.component';
import { CompletenessComponent } from 'src/app/MAIN_VIEW_ELEMENTS/completeness/completeness.component';
import { ServiceAvailabilityComponent } from 'src/app/MAIN_VIEW_ELEMENTS/service-availability/service-availability.component';
import { PublicationTimelinessComponent } from 'src/app/MAIN_VIEW_ELEMENTS/publication-timeliness/publication-timeliness.component';
import { EditCentresComponent } from 'src/app/edit-centres/edit-centres.component';
import { EditServicesComponent } from 'src/app/edit-services/edit-services.component';
import { EditSyncComponent } from 'src/app/edit-sync/edit-sync.component';

export const routes: Routes = [
  { path: 'dafne-login', component: LoginComponent, runGuardsAndResolvers: 'always'},
  { path: 'gui', component: MainViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always',
    children: [
      /* Auxiliary routes */
      { path: 'network-view/:mapType', outlet: 'centralBodyRouter', component: NetworkViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'completeness', outlet: 'centralBodyRouter', component: CompletenessComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'publication-timeliness', outlet: 'centralBodyRouter', component: PublicationTimelinessComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'service-availability', outlet: 'centralBodyRouter', component: ServiceAvailabilityComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'edit-centres', outlet: 'centralBodyRouter', component: EditCentresComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
      { path: 'edit-services', outlet: 'centralBodyRouter', component: EditServicesComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
      { path: 'edit-sync', outlet: 'centralBodyRouter', component: EditSyncComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
      { path: '', outlet: 'centralBodyRouter', component: NetworkViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: '**', outlet: 'centralBodyRouter', component: NetworkViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'}
    ]
  },
  { path: '', redirectTo: 'gui', pathMatch: 'full'},
  { path: '**', redirectTo: 'gui'}
];
