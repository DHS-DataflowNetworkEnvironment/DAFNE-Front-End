import { Component, OnInit, signal } from '@angular/core';
import { Centre, DataSourcesInfo } from '@app/models/models';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '@app/services/authentication.service';
import { MessageService } from '@app/services/message.service';
import { AlertService } from '@app/services/alert.service';
import { Router, NavigationEnd, RouterModule } from '@angular/router';


@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  public archiveList = signal<any[]>([]);
  public dataSourcesList = signal<DataSourcesInfo[]>([]);
  public dhsConnectedNum = signal<number>(0);

  private localId: number = -1;
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
    private router: Router,
    private alert: AlertService
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
        }
      }
    });
  }

  ngOnInit() {
    this.messageService.sidebarMessage.subscribe(hide => {
      if (hide) {
        this.onSidebarHide();
      } else {
        this.checkIfHideSidebar();
      }
    });
    this.messageService.refreshLocalMessage.subscribe(() => {
      this.getSidebarData();
    });
    this.checkIfHideSidebar();
  }

  isAdmin() {
    return this.authenticationService.currentUser.isAdmin;
  }

  checkIfHideSidebar() {
    if (window.innerWidth < this.widthThreshold) {
      this.onSidebarHide();
    } else {
      this.onSidebarShow();
    }
  }

  async getSidebarData() {
    if (await this.authenticationService.isUserAuthenticated()) {
      this.authenticationService.getAllCentres().subscribe(
        (res: object) => {
          if (Object.values(res).find((x) => x.local == true)) {
            // Refresh local centre:
            this.localCentre = Object.values(res).find((x) => x.local == true);
            this.localId = this.localCentre.id;

            // Refresh data sources info based on local centre:
            this.authenticationService.getServiceData().subscribe({
              next: (res) => {
                this.authenticationService.getDataSourcesInfo(this.localId).subscribe({
                  next: (resDSI: DataSourcesInfo[]) => {
                    this.dataSourcesList.set(resDSI);
                    this.dataSourcesList().sort(this.getSortCentreOrder("name"));
                    this.messageService.showIngesters(true);
                  },
                  error: (error) => {
                    console.log("Error occurred while fetching Data Sources info:");
                    console.error(error);
                    console.error(error.status);
                  }
                });

                // get DHS Connected:
                this.authenticationService.getDHSConnected(this.localId).subscribe({
                  next: (resDHS) => {
                    const dhsIdArray = resDHS.map((dhs: any) => dhs.service.id);
                    this.dhsConnectedNum.set([...new Set(dhsIdArray)].length);
                  },
                  error: (error) => {
                    console.log("Error occurred while fetching DHS connected info:");
                    console.error(error);
                    console.error(error.status);
                  }
                })

                // get Rolling:
                this.authenticationService.getRolling(this.localId).subscribe({
                  next: (resRolling) => {
                    //console.log("Got Rolling Policy:", resRolling);
                    this.archiveList.set(resRolling);
                    setTimeout(() => {
                      let archiveInfoElementDivArr: NodeListOf<HTMLElement> = document.querySelectorAll('.archive-info-element-filters-div');
                      if (archiveInfoElementDivArr.length === this.archiveList().length) {
                        archiveInfoElementDivArr.forEach((archiveInfoElementDiv: HTMLElement, index: number) => {
                          const multiplier = this.archiveList()[index].filters.length;
                          archiveInfoElementDiv.style.maxHeight = multiplier + 'rem';
                        });
                      }
                    }, 10);
                  },
                  error: (error) => {
                    console.log("Error occurred while fetching Rolling policy info:");
                    console.error(error);
                    console.error(error.status);
                  }
                })
              },
              error: (error) => {
                console.log("Error occurred while fetching serviceData:");
                console.error(error);
                console.error(error.status);
                this.messageService.showIngesters(false);
              }
            });
          } else {
            this.localCentre = this.ndLocalCentre;
            this.localId = -1;
            this.alert.showAlert("No local Centre has been set", "Please setup one Centre as local");
          }          
        }
      );
    }
  }
  
  onArchiveItemClicked(event: Event) {
    let itemEl = event.target as HTMLElement;
    if (!itemEl.classList.contains('archive-info-element')) return;
    let innerFilterEl = itemEl.querySelector('.archive-info-element-filters-div');
    if (innerFilterEl) {     
      if (innerFilterEl.classList.contains('hidden')) { 
        document.querySelectorAll('.archive-info-element-filters-div').forEach((el) => {
          el.classList.add('hidden');
        });      
        innerFilterEl.classList.remove('hidden');
      } else {
        innerFilterEl.classList.add('hidden');
      }
    }
  }

  getSortCentreOrder(prop: keyof Centre) {
    return function(a: DataSourcesInfo, b: DataSourcesInfo) {
      if (a.centre && b.centre) {
        if (a.centre[prop] > b.centre[prop]) {
          return 1;
        } else if (a.centre[prop] < b.centre[prop]) {
          return -1;
        }
      }
      return 0;
    }
  }

  onGenerateReportClicked() {
    this.messageService.showReport(true);
  }

  onSidebarHide() {
    let sidebarContainer = <HTMLElement>document.querySelector('#sidebar-container');
    if (sidebarContainer) {
      (sidebarContainer!).classList.add('hidden');
      setTimeout(() => {
        (<HTMLElement>document.querySelector('#sidebar-left-arrow-container')!).classList.add('hidden');
        (<HTMLElement>document.querySelector('#sidebar-right-arrow-container')!).classList.remove('hidden');
      }, 250);
    }
  }
  onSidebarShow() {
    this.shouldCheckResize = true;
    let sidebarContainer = <HTMLElement>document.querySelector('#sidebar-container');
    if (sidebarContainer) {
      (sidebarContainer!).classList.remove('hidden');
      setTimeout(() => {
        (<HTMLElement>document.querySelector('#sidebar-right-arrow-container')!).classList.add('hidden');
        (<HTMLElement>document.querySelector('#sidebar-left-arrow-container')!).classList.remove('hidden');
      }, 250);
    }
  }
}
