import { Component, Injectable, OnInit } from '@angular/core';

declare var $: any;

@Injectable({
    providedIn: 'root'
})
@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {

  public title: string;
  public message: string;
  public icon: string;

  constructor() {
    this.icon = 'assets/images/info.svg';
    this.title = 'test';
    this.message = 'test message';
  }

  ngOnInit() {
    window.onclick = function (event: any) {
      if (!event.target.matches('.toast')) {
        if($('#portal-toast').is(':visible'))
            $('#portal-toast').toast('hide');

      }
    };

    $('#portal-toast').on('hidden.bs.toast', function () {
      $('#portal-toast').css('pointer-events','none');
    })
  }

  showInfoToast(title: string, message: string) {
    this.icon = 'assets/images/info.svg';
    this.showToast(title, message);
  }

  showSuccessToast(title: string, message: string) {
    this.icon = 'assets/images/success.svg';
    this.showToast(title, message);
  }

  showWarningToast(title: string, message: string) {
    this.icon = 'assets/images/warning.svg';
    this.showToast(title, message);
  }

  showErrorToast(title: string, message: string) {
    this.icon = 'assets/images/error.svg';
    this.showToast(title, message);
  }

  showToast(title: string, message: string) {
    this.title = title;
    this.message = message;
    $('.toast-icon').attr('src',this.icon);
    $('.toast-title').html(this.title);
    $('.toast-body').html(this.message);
    $('#portal-toast').css('pointer-events','all');
    $('#portal-toast').toast('show');
  }

}
