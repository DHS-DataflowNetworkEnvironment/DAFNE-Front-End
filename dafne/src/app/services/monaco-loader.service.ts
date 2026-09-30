import { Injectable } from '@angular/core';
declare const monaco: any;

@Injectable({
  providedIn: 'root',
})
export class MonacoLoaderService {
  private loadPromise: Promise<any> | null = null;

  load(): Promise<any> {
    // Se il caricamento è già in corso o completato, riusa la stessa promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve) => {
      const onGotAmdLoader = () => {
        (window as any).require.config({ paths: { vs: 'assets/monaco/vs' } });
        (window as any).require(['vs/editor/editor.main'], () => {
          resolve(monaco);
        });
      };

      if (!(window as any).require) {
        const loaderScript = document.createElement('script');
        loaderScript.type = 'text/javascript';
        loaderScript.src = 'assets/monaco/vs/loader.js';
        loaderScript.onload = onGotAmdLoader;
        document.body.appendChild(loaderScript);
      } else {
        onGotAmdLoader();
      }
    });

    return this.loadPromise;
  }
}
