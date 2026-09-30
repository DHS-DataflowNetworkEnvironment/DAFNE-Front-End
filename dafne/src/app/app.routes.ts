import { Routes } from '@angular/router';
import { AuthGuard } from '@app/util/auth.guard';
import { LoginComponent } from '@app/login/login.component';
import { MainViewComponent } from '@app/main-view/main-view.component';
import { NetworkViewComponent } from '@app/MAIN_VIEW_ELEMENTS/network-view/network-view.component';
import { CompletenessComponent } from '@app/MAIN_VIEW_ELEMENTS/completeness/completeness.component';
import { ServiceAvailabilityComponent } from '@app/MAIN_VIEW_ELEMENTS/service-availability/service-availability.component';
import { PublicationTimelinessComponent } from '@app/MAIN_VIEW_ELEMENTS/publication-timeliness/publication-timeliness.component';
import { EditCentresComponent } from '@app/edit-centres/edit-centres.component';
import { EditServicesComponent } from '@app/edit-services/edit-services.component';
import { EditIngestersComponent } from '@app/edit-ingesters/edit-ingesters.component';

export const routes: Routes = [
  { path: 'dafne-login', component: LoginComponent, runGuardsAndResolvers: 'always'},
  { path: 'home', component: MainViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always',
    children: [
      /* Auxiliary routes */
      { path: 'network-view/:mapType', outlet: 'centralBodyRouter', component: NetworkViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'completeness', outlet: 'centralBodyRouter', component: CompletenessComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'publication-timeliness', outlet: 'centralBodyRouter', component: PublicationTimelinessComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'service-availability', outlet: 'centralBodyRouter', component: ServiceAvailabilityComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: 'edit-centres', outlet: 'centralBodyRouter', component: EditCentresComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
      { path: 'edit-services', outlet: 'centralBodyRouter', component: EditServicesComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
      { path: 'edit-ingesters', outlet: 'centralBodyRouter', component: EditIngestersComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always' },
      { path: '', outlet: 'centralBodyRouter', component: NetworkViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'},
      { path: '**', outlet: 'centralBodyRouter', component: NetworkViewComponent, canActivate: [AuthGuard], runGuardsAndResolvers: 'always'}
    ]
  },
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: '**', redirectTo: 'home'}
];
