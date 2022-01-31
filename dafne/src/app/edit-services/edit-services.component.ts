import { Component, OnInit } from '@angular/core';
import { Service } from '../models/service';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';
import { AlertComponent } from '../alert/alert.component';

declare var $: any;

const regexPatterns = {
  add_username: "^.{1,60}$",
  add_password: "^.{1,60}$",
  add_service_url: "^[^\ \,\;]{1,256}$",
  add_service_type: "",
  add_centre: "",

  edit_username: "^.{1,60}$",
  edit_password: "^.{1,60}$",
  edit_service_url: "^[^\ \,\;]{1,256}$",
  edit_service_type: "",
  edit_centre: ""
};

@Component({
  selector: 'app-edit-services',
  templateUrl: './edit-services.component.html',
  styleUrls: ['./edit-services.component.css']
})
export class EditServicesComponent implements OnInit {
  public serviceList: any;
  public centreList: any;
  public service: Service = new Service();
  public tempServiceIdToDelete = -1;
  public tempServiceUrlToDelete = '';
  
  public serviceTypesList;

  constructor(
    public authenticationService: AuthenticationService,
    private router: Router,
    private alert: AlertComponent
  ) { }

  ngOnInit(): void {
    this.getAllServiceTypes();
    this.getServices();

    let inputs = document.querySelectorAll('input.form-control');
    inputs.forEach((input) => {
      input.addEventListener('keyup', (e:any) => {        
        this.validate(e.target, regexPatterns[e.target.attributes.id.value]);
      });
    });
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
      }
    );
  }

  setNewFormServiceType(id: number) {
    this.service.service_type = this.serviceTypesList.filter(a => a.id == id)[0].service_type;
  }

  setNewFormCentre(centreId: number) {
    this.service.centre = this.centreList.filter(a => a.id == centreId)[0].name;
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
      if (input.className == "form-control invalid") {
        valid = false;
        this.alert.showErrorAlert("Form value error", "You entered an invalid value into '" + input.id + "' field.");
      }
    });
    if (valid) {
      //console.log("ADD SERVICE SUBMITTED");
      let body = {
        username: (<HTMLInputElement>document.getElementById("add_username")).value,
        password: (<HTMLInputElement>document.getElementById('add_password')).value,
        service_url: (<HTMLInputElement>document.getElementById('add_service_url')).value,
        service_type: this.serviceTypesList.filter(a => a.service_type == (<HTMLInputElement>document.getElementById('add_service_type')).value)[0].id,
        centre: this.centreList.filter(a => a.name == (<HTMLInputElement>document.getElementById('add_centre')).value)[0].id,
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
      if (input.className == "form-control invalid") {
        valid = false;
        this.alert.showErrorAlert("Form value error", "You entered an invalid value into '" + input.id + "' field.");
      }
    });
    if (valid) {
      let body: any;
      if ((<HTMLInputElement>document.getElementById('edit_password')).value == '') {
        body = {
          username: (<HTMLInputElement>document.getElementById("edit_username")).value,
          service_url: (<HTMLInputElement>document.getElementById('edit_service_url')).value,
          service_type: this.serviceTypesList.filter(a => a.service_type == (<HTMLInputElement>document.getElementById('edit_service_type')).value)[0].id,
          centre: this.centreList.filter(a => a.name == (<HTMLInputElement>document.getElementById('edit_centre')).value)[0].id,
        };       
      } else {
        body = {
          username: (<HTMLInputElement>document.getElementById("edit_username")).value,
          password: (<HTMLInputElement>document.getElementById('edit_password')).value,
          service_url: (<HTMLInputElement>document.getElementById('edit_service_url')).value,
          service_type: this.serviceTypesList.filter(a => a.service_type == (<HTMLInputElement>document.getElementById('edit_service_type')).value)[0].id,
          centre: this.centreList.filter(a => a.name == (<HTMLInputElement>document.getElementById('edit_centre')).value)[0].id,
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
