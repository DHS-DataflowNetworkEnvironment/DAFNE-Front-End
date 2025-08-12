import { Component, OnInit } from '@angular/core';
import { Centre } from 'src/app/models/models';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MessageService } from 'src/app/services/message.service';
import { Router, NavigationEnd, RouterModule } from '@angular/router';


@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  public ndLocalCentre: Centre = {
    id: -1,
    name: "N/D",
    latitude: "0.0",
    longitude: "0.0",
    local: true,
    icon: "home",
    color: "#555",
    description: ''
  }; 
  public localCentre: Centre = this.ndLocalCentre;
  private widthThreshold: number = 1280;
  private shouldCheckResize: boolean = true;

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private router: Router
  ) {
    router.events.subscribe({
      next: (event) => {
        if (event instanceof NavigationEnd) {
          if (event.url.includes('edit-centres') || event.url.includes('edit-services') || event.url.includes('completeness') || event.url.includes('service-availability')) {
            this.shouldCheckResize = false;
          } else {
            this.shouldCheckResize = true;
          }
          window.addEventListener("resize", () => {
            if (this.shouldCheckResize) {
              this.checkIfHideSidebar();
            }
          });
          this.getLocalCentre();
        }
      }
    });
  }

  ngOnInit() {
    this.getLocalCentre();
    this.messageService.sidebarMessage.subscribe(hide => {
      if (hide) {
        this.onSidebarHide();
      } else {
        this.checkIfHideSidebar();
      }
    });
    this.messageService.refreshLocalMessage.subscribe(() => {
      this.getLocalCentre();      
    });
    this.checkIfHideSidebar();
  }

  checkIfHideSidebar() {
    if (window.innerWidth < this.widthThreshold) {
      this.onSidebarHide();
    } else {
      this.onSidebarShow();
    }
  }

  getLocalCentre() {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        if (Object.values(res).filter((x) => x.local == true)[0]) {
          this.localCentre = Object.values(res).filter((x) => x.local == true)[0];
        } else {
          this.localCentre = this.ndLocalCentre;
        }
      }
    );
  }

  onSidebarHide() {
    (<HTMLElement>document.querySelector('#sidebar-container')!).classList.add('hidden');
    setTimeout(() => {
      (<HTMLElement>document.querySelector('#sidebar-left-arrow-container')!).classList.add('hidden');
      (<HTMLElement>document.querySelector('#sidebar-right-arrow-container')!).classList.remove('hidden');
    }, 250);
  }
  onSidebarShow() {
    this.shouldCheckResize = true;
    (<HTMLElement>document.querySelector('#sidebar-container')!).classList.remove('hidden');
    setTimeout(() => {
      (<HTMLElement>document.querySelector('#sidebar-right-arrow-container')!).classList.add('hidden');
      (<HTMLElement>document.querySelector('#sidebar-left-arrow-container')!).classList.remove('hidden');
    }, 250);
  }
}
