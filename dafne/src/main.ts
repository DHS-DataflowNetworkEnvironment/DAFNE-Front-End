import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err)); 

;(window as any).MonacoEnvironment = {
  getWorkerUrl: (moduleId: string, label: string) => {
      if (label === 'json') {
          return './assets/monaco/esm/vs/language/json/json.worker.js'
      }
      return './assets/monaco/esm/vs/editor/editor.worker.js'
  },
}
