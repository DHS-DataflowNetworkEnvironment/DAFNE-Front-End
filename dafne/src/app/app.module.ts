import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NetworkViewComponent } from './MAIN_VIEW_ITEMS/network-view/network-view.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { UniqueNameFilterPipe } from './unique-name-filter.pipe';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CompletenessComponent } from './MAIN_VIEW_ITEMS/completeness/completeness.component';
import { LoginComponent } from './login/login.component';
import { ArchiveInfoComponent } from './SIDEBAR_ITEMS/archive-info/archive-info.component';
import { DataSourceInfoComponent } from './SIDEBAR_ITEMS/data-source-info/data-source-info.component';
import { DhsConnectedComponent } from './SIDEBAR_ITEMS/dhs-connected/dhs-connected.component';
import { DhsCompletenessComponent } from './SIDEBAR_ITEMS/dhs-completeness/dhs-completeness.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MainViewComponent } from './main-view/main-view.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CentreComponent } from './SIDEBAR_ITEMS/centre/centre.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './util/jwt.interceptor';
import { ErrorInterceptor } from './util/error.interceptor';
import { ToastComponent } from './toast/toast.component';
import { AlertComponent } from './alert/alert.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { EditCentresComponent } from './edit-centres/edit-centres.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { EditServicesComponent } from './edit-services/edit-services.component';
import { EditSyncComponent } from './edit-sync/edit-sync.component';
import { DpDatePickerModule } from 'ng2-date-picker';
import { AppConfig } from './services/app.config';
import { PublicationLatencyComponent } from './MAIN_VIEW_ITEMS/publication-latency/publication-latency.component';
import { PubLatencyComponent } from './SIDEBAR_ITEMS/pub-latency/pub-latency.component';
import { ServiceAvailabilityComponent } from './MAIN_VIEW_ITEMS/service-availability/service-availability.component';
import { ServAvailabilityComponent } from './SIDEBAR_ITEMS/serv-availability/serv-availability.component';

export function initializeApp(
  appConfig: AppConfig
) {
    return () => appConfig.load();
}


@NgModule({
  declarations: [
    AppComponent,
    NetworkViewComponent,
    HeaderComponent,
    FooterComponent,
    UniqueNameFilterPipe,
    CompletenessComponent,
    LoginComponent,
    ArchiveInfoComponent,
    DataSourceInfoComponent,
    DhsConnectedComponent,
    DhsCompletenessComponent,
    SidebarComponent,
    MainViewComponent,
    CentreComponent,
    ToastComponent,
    AlertComponent,
    SpinnerComponent,
    EditCentresComponent,
    EditServicesComponent,
    EditSyncComponent,
    PubLatencyComponent,
    PublicationLatencyComponent,
    ServiceAvailabilityComponent,
    ServAvailabilityComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatIconModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ColorPickerModule,
    DpDatePickerModule
  ],
  exports: [
    MatIconModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppConfig], multi: true
    },
    AppConfig,
    SpinnerComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
