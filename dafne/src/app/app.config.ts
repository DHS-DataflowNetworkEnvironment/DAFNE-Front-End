import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from 'src/app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from 'src/app/util/jwt.interceptor';
import { errorInterceptor } from 'src/app//util/error.interceptor';
import { ConfigService } from 'src/app/services/config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.loadConfig();
    }),
    provideRouter(routes), 
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))
  ]
};