import { Component, OnInit } from '@angular/core';
import { MessageService } from '../services/message.service';

declare var $: any;

$(window).resize(function() {
    $('#sidebar').attr('style', '');
    $('#main-view-content').attr('style', '');
    $('#central-div').attr('style', '');
});

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css']
})
export class MainViewComponent implements OnInit {

  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
  }

  resize() {
    this.messageService.changeMessage("resize");
  }

  toggleSidebar() {
    if (getComputedStyle(document.getElementById("sidebar")).visibility == 'collapse') {
      /* Show */
      document.getElementById("sidebar").style.visibility = 'visible';
      if (screen.width > 1280) {
        document.getElementById("main-view-content").style.width = 'calc(100% - 17rem)';
        document.getElementById("sidebar").style.width = '17rem';
      } else {
        document.getElementById("main-view-content").style.width = 'calc(100% - 14rem)';
        document.getElementById("sidebar").style.width = '14rem';
      }
      document.getElementById("main-view-content").style.paddingLeft = '0.5rem';
      document.getElementById("central-div").style.height = 'calc(100vh - 6.2rem)';
      this.resize();
    } else {
      /* Hide */
      document.getElementById("sidebar").style.width = '0rem';
      document.getElementById("sidebar").style.visibility = 'collapse';
      document.getElementById("main-view-content").style.width = '100%';
      document.getElementById("main-view-content").style.paddingLeft = '0rem';
      document.getElementById("central-div").style.height = 'calc(100vh - 6.2rem)';
      this.resize();
    }
  }
}
