import { Component, OnInit, OnDestroy } from '@angular/core';
import { Service } from '../models/service';
import { AuthenticationService } from '../services/authentication.service';
import { Router, NavigationEnd } from '@angular/router';
import { AlertComponent } from '../alert/alert.component';
import { MessageService } from '../services/message.service';
import { interval, Subscription } from 'rxjs';
import { AppConfig } from '../services/app.config';

declare var $: any;

const regexPatterns = {
  add_username: "^.{1,60}$",
  add_password: "^.{1,60}$",
  add_service_url: "^[^\ \,\;]{1,256}$",
  add_service_type: "^.{1,60}$",
  add_centre: "^.{1,60}$",

  edit_username: "^.{1,60}$",
  edit_password: "",
  edit_service_url: "^[^\ \,\;]{1,256}$",
  edit_service_type: "^.{1,60}$",
  edit_centre: "^.{1,60}$"
};

@Component({
  selector: 'app-edit-services',
  templateUrl: './edit-services.component.html',
  styleUrls: ['./edit-services.component.css']
})
export class EditServicesComponent implements OnInit, OnDestroy {
  navigationSubscription;
  private pageRefreshed: boolean = true;
  public serviceList: any;
  public centreList: any;
  public service: Service = new Service();
  public tempServiceIdToDelete = -1;
  public tempServiceUrlToDelete = '';
  
  public serviceTypesList;

  public dataRefreshTime = AppConfig.settings.dataRefreshTime;
  subscription: Subscription;

  constructor(
    public authenticationService: AuthenticationService,
    private router: Router,
    private alert: AlertComponent,
    private messageService: MessageService
  ) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        if (this.pageRefreshed == false) {
          this.pageRefreshed = true;
          this.ngOnInit();
        }
      }
    });
  }

  ngOnInit(): void {
    const dataRefresh = interval(this.dataRefreshTime);

    this.messageService.showSpinner(true);
    this.getAllServiceTypes();
    this.getServices();

    this.subscription = dataRefresh.subscribe(n => {
      // get data after Init every x milliseconds:
      this.messageService.showSpinner(false);
      this.getAllServiceTypes();
      this.getServices();
    });

    let inputs = document.querySelectorAll('input.form-control');
    inputs.forEach((input) => {
      input.addEventListener('input', (e:any) => {        
        this.validate(e.target, regexPatterns[e.target.attributes.id.value]);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  validate(field, regex) {
    const rx = new RegExp(regex, 'i');
    if (rx.test(field.value)) {      
      field.className = 'form-control valid';
    } else {
      field.className = 'form-control invalid';
    }
  }

  getAllServiceTypes() {
    this.authenticationService.getAllServiceTypes().subscribe(
      (res: []) => {
        //console.log("ALL SERVICE TYPES: " + JSON.stringify(res));
        res.sort(this.GetSortOrder('id'));
        this.serviceTypesList = res;
        //console.log("SORTED: " + JSON.stringify(this.serviceTypesList));
      }
    );
  }

  GetSortOrder(prop) {    
      return function(a, b) {    
          if (a[prop] > b[prop]) {    
              return 1;    
          } else if (a[prop] < b[prop]) {    
              return -1;    
          }    
          return 0;    
      }    
  } 

  getServices():any {
    this.authenticationService.getAllServices().subscribe(
      (res: object) => {
        this.serviceList = res;
        for (var i = 0; i < this.serviceList.length; i++) {
            this.getServiceType(i, this.serviceList[i].service_type);
        }
        this.getCentresData();
      }
    );
  }

  getServiceType(index: number, id: number): any {
    this.authenticationService.getServiceType(id).subscribe(
      (res: {id: number, createdAt: string, updatedAt: string, service_type: string}) => {
        /* console.log("Service type for service " + index + " is: " + res.service_type); */
        /* Converting service-type IDs to Names from service-type List */
        this.serviceList[index].service_type = res.service_type;
      }
    );
  }

  getCentresData():any {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        this.centreList = res;
        for (var i = 0; i < this.serviceList.length; i++) {
          this.serviceList[i].centre = this.centreList.filter(a => a.id == this.serviceList[i].centre)[0].name;
        }
        this.pageRefreshed = false;
      }
    );
  }

  setNewFormServiceType(id: number) {
    this.service.service_type = this.serviceTypesList.filter(a => a.id == id)[0].service_type;
  }

  setNewFormCentre(centreId: number) {
    this.service.centre = this.centreList.filter(a => a.id == centreId)[0].name;
  }

  public findLableForControl(el) {
    var idVal = el.id;
    let labels = document.getElementsByTagName('label');
    for( var i = 0; i < labels.length; i++ ) {
       if (labels[i].htmlFor == idVal)
            return labels[i];
    }
    return undefined;
  }

  /* Function called by addCentre button */
  public addNewService() {
    this.service.username = '';
    this.service.password = '';
    this.service.service_url = '';
    this.service.service_type = '';
    this.service.centre = '';
    $("#addServiceModal").modal('toggle');
  }


  public onAddSubmit() {
    let valid = true;
    let inputs = document.querySelectorAll('#addServiceForm input.form-control');
    inputs.forEach((input) => {
      this.validate(input, regexPatterns[input.id]);
      if (input.className == "form-control invalid") {
        valid = false;
        this.alert.showErrorAlert("Form value error", "You entered an invalid value into '" + this.findLableForControl(input).innerHTML + "' field.");
      }
    });
    
    if (valid) {
      let tempCentreId = this.centreList.filter(a => a.name == (<HTMLInputElement>document.getElementById('add_centre')).value)[0].id;
      //console.log("EDIT SERVICES - Trying to add Centre Id: " + tempCentreId);
      let tempServiceTypeId = this.serviceTypesList.filter(a => a.service_type == (<HTMLInputElement>document.getElementById('add_service_type')).value)[0].id;
      if (tempServiceTypeId != this.serviceTypesList.filter(a => a.service_type == 'DHuS Back-End')[0].id) {
        for (var i = 0; i < this.serviceList.length; i++) {
          if (tempCentreId == this.centreList.filter(a => a.name == this.serviceList[i].centre)[0].id) {
            //console.log("EDIT SERVICES - Centre already in list");
            if (
              this.serviceTypesList.filter(a => a.service_type == this.serviceList[i].service_type)[0].id == this.serviceTypesList.filter(a => a.service_type == 'DHuS Front-End')[0].id ||
              this.serviceTypesList.filter(a => a.service_type == this.serviceList[i].service_type)[0].id == this.serviceTypesList.filter(a => a.service_type == 'DHuS Single Instance')[0].id
            ) {
              //console.log("EDIT SERVICES - Service configuration not accepted!");
              valid = false;
              this.alert.showErrorAlert("Service Configuration Error", "You cannot setup two services associated to the same Centre with Single Instance or Front-End service types");
            }
          }
        }
      }
      //console.log("ADD SERVICE SUBMITTED");
      let body = {
        username: (<HTMLInputElement>document.getElementById("add_username")).value,
        password: (<HTMLInputElement>document.getElementById('add_password')).value,
        service_url: (<HTMLInputElement>document.getElementById('add_service_url')).value,
        service_type: tempServiceTypeId,
        centre: tempCentreId,
      };
      this.authenticationService.addNewService(body).subscribe(
        (res: string) => {
          /* Refresh page: */
          this.refreshPage();
        }
      );
    } else {

    }
  }

  /* Function called by delete button in any service */
  public deleteService(id: number) { 
    this.tempServiceIdToDelete = id;
    this.tempServiceUrlToDelete = this.serviceList.filter(a => a.id == id)[0].service_url;
    $("#deleteServiceModal").modal('toggle');
  }

  public deleteServiceConfirmed() {
    this.authenticationService.deleteService(this.tempServiceIdToDelete).subscribe(
      (res: string) => {
        this.tempServiceIdToDelete = -1;
        /* Refresh page: */
        this.refreshPage();
      }
    )
  }

  public deleteServiceCanceled() {
    this.tempServiceIdToDelete = -1;
  }

  /* Function called by edit button in any service */
  public editService(id: number) {
    this.service.id = this.serviceList.filter(a => a.id === id)[0].id;
    this.service.username = this.serviceList.filter(a => a.id === id)[0].username;
    this.service.password = ''; //this.serviceList.filter(a => a.id === id)[0].password;
    this.service.service_url = this.serviceList.filter(a => a.id === id)[0].service_url;
    this.service.service_type = this.serviceList.filter(a => a.id === id)[0].service_type;
    this.service.centre = this.serviceList.filter(a => a.id === id)[0].centre;
    $("#editServiceModal").modal('toggle');
  }

  public onEditSubmit(id: number) {
    let valid = true;
    let inputs = document.querySelectorAll('#editServiceForm input.form-control');
    inputs.forEach((input) => {
      this.validate(input, regexPatterns[input.id]);
      if (input.className == "form-control invalid") {
        valid = false;
        this.alert.showErrorAlert("Form value error", "You entered an invalid value into '" + this.findLableForControl(input).innerHTML + "' field.");
      }
    });
    let tempCentreId = this.centreList.filter(a => a.name == (<HTMLInputElement>document.getElementById('edit_centre')).value)[0].id;
    //console.log("EDIT SERVICE - Trying to edit Centre Id: " + tempCentreId);
    let tempServiceTypeId = this.serviceTypesList.filter(a => a.service_type == (<HTMLInputElement>document.getElementById('edit_service_type')).value)[0].id;
    if (tempServiceTypeId != this.serviceTypesList.filter(a => a.service_type == 'DHuS Back-End')[0].id) {
      for (var i = 0; i < this.serviceList.length; i++) {
        if (tempCentreId == this.centreList.filter(a => a.name == this.serviceList[i].centre)[0].id) {
          //console.log("EDIT SERVICE - Centre already in list");
          if (
            this.serviceTypesList.filter(a => a.service_type == this.serviceList[i].service_type)[0].id == this.serviceTypesList.filter(a => a.service_type == 'DHuS Front-End')[0].id ||
            this.serviceTypesList.filter(a => a.service_type == this.serviceList[i].service_type)[0].id == this.serviceTypesList.filter(a => a.service_type == 'DHuS Single Instance')[0].id
          ) {
            //console.log("EDIT SERVICE - Service configuration not accepted!");
            valid = false;
            this.alert.showErrorAlert("Service Configuration Error", "You cannot setup two services associated to the same Centre with Single Instance or Front-End service types");
          }
        }
      }
    }
    if (valid) {
      let body: any;
      if ((<HTMLInputElement>document.getElementById('edit_password')).value == '') {
        body = {
          username: (<HTMLInputElement>document.getElementById("edit_username")).value,
          service_url: (<HTMLInputElement>document.getElementById('edit_service_url')).value,
          service_type: tempServiceTypeId,
          centre: tempCentreId,
        };       
      } else {
        body = {
          username: (<HTMLInputElement>document.getElementById("edit_username")).value,
          password: (<HTMLInputElement>document.getElementById('edit_password')).value,
          service_url: (<HTMLInputElement>document.getElementById('edit_service_url')).value,
          service_type: tempServiceTypeId,
          centre: tempCentreId,
        };
      }
      this.authenticationService.updateService(id, body).subscribe(
        (res: string) => {
          
          /* Refresh page: */
          this.refreshPage();
        }
      );
    } else {

    }
  }

  refreshPage() {
    this.authenticationService.getAllServices().subscribe(
      (res: object) => {
        this.serviceList = res;
        for (var i = 0; i < this.serviceList.length; i++) {
          this.getServiceType(i, this.serviceList[i].service_type);
        }
        this.getCentresData();
        this.router.navigate(['edit-services'], { skipLocationChange: true });
      }
    );
  }
}
