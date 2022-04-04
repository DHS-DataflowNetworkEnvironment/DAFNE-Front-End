import { Component, OnInit, OnDestroy } from '@angular/core';
import { Service } from '../models/service';
import { AuthenticationService } from '../services/authentication.service';
import { Router, NavigationEnd } from '@angular/router';
import { AlertComponent } from '../alert/alert.component';
import { MessageService } from '../services/message.service';

declare var $: any;

const regexPatterns = {
  add_service_username: "^.{1,60}$",
  add_service_password: "^.{1,60}$",
  add_service_url: "^[^\ \,\;]{1,256}$",
  add_service_type: "^.{1,60}$",
  add_centre: "^.{1,60}$",

  edit_service_username: "^.{1,60}$",
  edit_service_password: "",
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
  private autorefreshSubscription;
  private navigationSubscription;
  private pageRefreshed: boolean = true;
  public serviceList: any;
  public centreList: any;
  public service: Service = new Service();
  public tempServiceIdToDelete = -1;
  public tempServiceUrlToDelete = '';
  
  public serviceTypesList;

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

    this.autorefreshSubscription = this.messageService.invokeAutoRefresh.subscribe(() => {
      this.messageService.showSpinner(false);
      this.getAllServiceTypes();
      this.getServices();
    });
  }

  ngOnInit(): void {
    this.messageService.showSpinner(true);
    this.getAllServiceTypes();
    this.getServices();

    let inputs = document.querySelectorAll('input.form-control');
    inputs.forEach((input) => {
      input.addEventListener('input', (e:any) => {        
        this.validate(e.target, regexPatterns[e.target.attributes.id.value]);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription != undefined) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.autorefreshSubscription != undefined) {
      this.autorefreshSubscription.unsubscribe();
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
        res.sort(this.GetSortOrder('id'));
        this.serviceTypesList = res;
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

  public addNewService() {
    this.service.service_type = '';
    this.service.username = '';
    this.service.password = '';
    this.service.service_url = '';    
    this.service.centre = '';
    let inputs = document.querySelectorAll('#addServiceForm input.form-control');
    inputs.forEach((input) => {
      if ((<HTMLInputElement>input).id == "add_service_type") (<HTMLInputElement>input).value = this.service.service_type;
      if ((<HTMLInputElement>input).id == "add_service_username") (<HTMLInputElement>input).value = this.service.username;
      if ((<HTMLInputElement>input).id == "add_service_password") (<HTMLInputElement>input).value = this.service.password;
      if ((<HTMLInputElement>input).id == "add_service_url") (<HTMLInputElement>input).value = this.service.service_url;
      if ((<HTMLInputElement>input).id == "add_centre") (<HTMLInputElement>input).value = this.service.centre;
    });
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
      let tempServiceTypeId = this.serviceTypesList.filter(a => a.service_type == (<HTMLInputElement>document.getElementById('add_service_type')).value)[0].id;
      if (tempServiceTypeId != this.serviceTypesList.filter(a => a.service_type == 'DHuS Back-End')[0].id) {
        for (var i = 0; i < this.serviceList.length; i++) {
          if (tempCentreId == this.centreList.filter(a => a.name == this.serviceList[i].centre)[0].id) {
            if (
              this.serviceTypesList.filter(a => a.service_type == this.serviceList[i].service_type)[0].id == this.serviceTypesList.filter(a => a.service_type == 'DHuS Front-End')[0].id ||
              this.serviceTypesList.filter(a => a.service_type == this.serviceList[i].service_type)[0].id == this.serviceTypesList.filter(a => a.service_type == 'DHuS Single Instance')[0].id
            ) {
              valid = false;
              this.alert.showErrorAlert("Service Configuration Error", "You cannot setup two services associated to the same Centre with Single Instance or Front-End service types");
            }
          }
        }
      }
      let body = {
        username: (<HTMLInputElement>document.getElementById("add_service_username")).value,
        password: (<HTMLInputElement>document.getElementById('add_service_password')).value,
        service_url: (<HTMLInputElement>document.getElementById('add_service_url')).value,
        service_type: tempServiceTypeId,
        centre: tempCentreId,
      };
      this.authenticationService.addNewService(body).subscribe(
        (res: string) => {
          this.refreshPage();
        }
      );
    } else {

    }
  }

  public deleteService(id: number) { 
    this.tempServiceIdToDelete = id;
    this.tempServiceUrlToDelete = this.serviceList.filter(a => a.id == id)[0].service_url;
    $("#deleteServiceModal").modal('toggle');
  }

  public deleteServiceConfirmed() {
    this.authenticationService.deleteService(this.tempServiceIdToDelete).subscribe(
      (res: string) => {
        this.tempServiceIdToDelete = -1;
        this.refreshPage();
      }
    )
  }

  public deleteServiceCanceled() {
    this.tempServiceIdToDelete = -1;
  }

  public editService(id: number) {
    this.service.id = this.serviceList.filter(a => a.id === id)[0].id;
    this.service.username = this.serviceList.filter(a => a.id === id)[0].username;
    this.service.password = '';
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
    let tempServiceTypeId = this.serviceTypesList.filter(a => a.service_type == (<HTMLInputElement>document.getElementById('edit_service_type')).value)[0].id;
    let tempServiceId = id;
    
    if (tempServiceTypeId != this.serviceTypesList.filter(a => a.service_type == 'DHuS Back-End')[0].id) {
      for (var i = 0; i < this.serviceList.length; i++) {
        if (tempCentreId == this.centreList.filter(a => a.name == this.serviceList[i].centre)[0].id 
          && this.serviceList[i].id != tempServiceId
        ) {
          if (
            this.serviceTypesList.filter(a => a.service_type == this.serviceList[i].service_type)[0].id == this.serviceTypesList.filter(a => a.service_type == 'DHuS Front-End')[0].id ||
            this.serviceTypesList.filter(a => a.service_type == this.serviceList[i].service_type)[0].id == this.serviceTypesList.filter(a => a.service_type == 'DHuS Single Instance')[0].id
          ) {
            valid = false;
            this.alert.showErrorAlert("Service Configuration Error", "You cannot setup two services associated to the same Centre with Single Instance or Front-End service types");
          }
        }
      }
    }
    if (valid) {
      let body: any;
      if ((<HTMLInputElement>document.getElementById('edit_service_password')).value == '') {
        body = {
          username: (<HTMLInputElement>document.getElementById("edit_service_username")).value,
          service_url: (<HTMLInputElement>document.getElementById('edit_service_url')).value,
          service_type: tempServiceTypeId,
          centre: tempCentreId,
        };       
      } else {
        body = {
          username: (<HTMLInputElement>document.getElementById("edit_service_username")).value,
          password: (<HTMLInputElement>document.getElementById('edit_service_password')).value,
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

  public toggleAddPasswordVisibility() {
    const togglePassword = document.querySelector('#toggleAddPassword');
    const passwordInput = document.querySelector('#add_service_password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // toggle the eye slash icon
    const eye = passwordInput.getAttribute('type') === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
    togglePassword.setAttribute('class', eye);
  }

  public toggleEditPasswordVisibility() {
    const togglePassword = document.querySelector('#toggleEditPassword');
    const passwordInput = document.querySelector('#edit_service_password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // toggle the eye slash icon
    const eye = passwordInput.getAttribute('type') === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
    togglePassword.setAttribute('class', eye);
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
