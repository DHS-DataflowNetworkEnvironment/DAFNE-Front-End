import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private resolver: ((value: boolean) => void) | null = null;

  public title!: SafeHtml;
  public message!: SafeHtml;
  public visible = false;
  public showCancelButton = true;

  constructor(private sanitizer: DomSanitizer) {}

  showConfirm(title: string, message: string): Promise<boolean> {
    this.title = this.sanitizer.bypassSecurityTrustHtml(title);
    this.message = this.sanitizer.bypassSecurityTrustHtml(message);
    this.visible = true;
    this.showCancelButton = true;

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  showAlert(title: string, message: string) {
    this.title = title;
    this.message = message;
    this.visible = true;
    this.showCancelButton = false;
  }

  resolve(result: boolean) {
    this.visible = false;

    if (this.resolver) {
      this.resolver(result);
      this.resolver = null; // prevent double resolve
    }
  }
}
