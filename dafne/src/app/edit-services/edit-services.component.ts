import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MessageService } from 'src/app/services/message.service';
import { Service, Centre, ServiceType } from 'src/app/models/models';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, Validators, FormGroup, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Functions } from 'src/app/util/functions';
import { AlertComponent } from 'src/app/alert/alert.component';
import { AppComponent } from 'src/app/app.component';

const regexPatterns: {[key:string]: string} = {
  "add-service_username": "^.{1,60}$",
  "add-service_password": "^.{1,60}$",
  "add-service_url": "^(https?:\\/\\/)?([a-zA-Z0-9\\-\\.]+\\.[a-zA-Z0-9]{2,})(\\/[^\\s]*)?$",
  "add-service_token_url": "^(https?:\\/\\/)?([a-zA-Z0-9\\-\\.]+\\.[a-zA-Z0-9]{2,})(\\/[^\\s]*)?$",
  "add-service_client_id": "^[^\\ \\,\\;]{1,256}$",

  "edit-service_username": "^.{1,60}$",
  "edit-service_password": "^.{0,60}$",
  "edit-service_url": "^(https?:\\/\\/)?([a-zA-Z0-9\\-\\.]+\\.[a-zA-Z0-9]{2,})(\\/[^\\s]*)?$",
  "edit-service_token_url": "^(https?:\\/\\/)?([a-zA-Z0-9\\-\\.]+\\.[a-zA-Z0-9]{2,})(\\/[^\\s]*)?$",
  "edit-service_client_id": "^[^\\ \\,\\;]{1,256}$"
};
const updateValidationAction: any = 'change';

export function notAlreadyAssociatedCentreValidator(services: Array<Service>, centres: Array<Centre>): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    let tempRet = null;
    if (control.value != null) {
      services.forEach((service: Service) => {
        let serviceCentreId = centres.filter((centre: Centre) => centre.name === control.value)[0].id;
        if (service.centre == serviceCentreId) {
          tempRet = {alreadyAssociatedCentre: {value: control.value}};
        }
      });
    }
    return tempRet;
  }
}

@Component({
  selector: 'app-edit-services',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './edit-services.component.html',
  styleUrl: './edit-services.component.scss'
})
export class EditServicesComponent implements OnInit{
  addServiceForm: FormGroup = new FormGroup({
    addServiceType: new FormControl(null, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    addServiceUsername: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['add-service_username'])
      ],
      updateOn: updateValidationAction
    }),
    addServicePassword: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['add-service_password'])
      ],
      updateOn: updateValidationAction
    }),
    addServiceUrl: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['add-service_url'])
      ],
      updateOn: updateValidationAction
    }),
    addServiceCentre: new FormControl(null, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    addServiceTokenUrl: new FormControl(null, {
      validators: [
        Validators.pattern(regexPatterns['add-service_token_url'])
      ],
      updateOn: updateValidationAction
    }),
    addServiceClientId: new FormControl(null, {
      validators: [
        Validators.pattern(regexPatterns['add-service_client_id'])
      ],
      updateOn: updateValidationAction
    })
  });

  editServiceForm: FormGroup = new FormGroup({
    editServiceType: new FormControl(null, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    editServiceUsername: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['edit-service_username'])
      ],
      updateOn: updateValidationAction
    }),
    editServicePassword: new FormControl(null, {
      validators: [
        //Validators.required,
        Validators.pattern(regexPatterns['edit-service_password'])
      ],
      updateOn: updateValidationAction
    }),
    editServiceUrl: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['edit-service_url'])
      ],
      updateOn: updateValidationAction
    }),
    editServiceCentre: new FormControl(null, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    editServiceTokenUrl: new FormControl(null, {
      validators: [
        Validators.pattern(regexPatterns['edit-service_token_url'])
      ],
      updateOn: updateValidationAction
    }),
    editServiceClientId: new FormControl(null, {
      validators: [
        Validators.pattern(regexPatterns['edit-service_client_id'])
      ],
      updateOn: updateValidationAction
    })
  });

  public serviceList: Array<Service> = [];
  public centreList: Array<Centre> = [];
  public service: Service = new Service();
  public tempServiceIdToEdit = -1;
  public tempServiceIdToDelete = -1;
  public tempServiceUrlToDelete = '';
  public showOauth2Fields: boolean = false;
  public showUsernameAndPassword: boolean = true;
  public serviceTypesList: Array<ServiceType> = [];
  public passwordIsVisible: boolean = false;
  public passwordHasBeenModified: boolean = false;
  private tempPrecServiceCentre: string = '';

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private router: Router,
    private functions: Functions,
    private alert: AlertComponent,
    private appComponent: AppComponent
  ) {

  }

  ngOnInit(): void {
    this.messageService.showSpinner(true);
    this.messageService.hideSidebar(true);
    this.getAllServiceTypes();
    this.getServices(false);
  }

  isAdmin() {
    return this.authenticationService.currentUser.isAdmin;
  }

  getAllServiceTypes() {
    this.authenticationService.getAllServiceTypes().subscribe({
      next: (res) => {
        res.sort(this.functions.getSortOrder("id"));
        this.serviceTypesList = res;
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }

  getServices(reload: boolean) {
    this.authenticationService.getAllServices().subscribe({
      next: (res) => {
        this.serviceList = res;
        this.getCentresData(reload);
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }

  getCentresData(reload: boolean):any {
    this.authenticationService.getAllCentres().subscribe({
      next: (res) => {
        this.centreList = res;
        for (var i = 0; i < this.serviceList.length; i++) {
          this.serviceList[i].centre = this.centreList.filter((a: Centre) => a.id == this.serviceList[i].centre)[0].id;
        }
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      },
      complete: () => {
        this.addServiceForm.get('addServiceCentre')?.setValidators(
          [
            Validators.required,
            notAlreadyAssociatedCentreValidator(this.serviceList, this.centreList)
          ]
        );
        this.addServiceForm.get('addServiceCentre')?.updateValueAndValidity();
        if (reload) {
          this.router.navigate(['/gui', { outlets: { centralBodyRouter: ['edit-services']}}], { skipLocationChange: true });
        }
      }
    });
  }

  onAddServiceTypeChange() {
    let tempServiceTypeId = this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.service_type === this.addServiceForm.value.addServiceType)[0].id;
    this.checkOauth2Support(tempServiceTypeId);
    if ([4, 5].includes(tempServiceTypeId)) {
      this.serviceList.forEach((service: Service) => {
        if ([4, 5].includes(service.service_type)) {
          if (service.service_type == tempServiceTypeId) {
            this.alert.showErrorAlert("Service of service_type " + this.addServiceForm.value.addServiceType + " is already present.", "Please choose another service_type.");
            this.addServiceForm.get('addServiceType')?.setErrors({incorrect: true});
            this.addServiceForm.get('addServiceType')?.markAsTouched();
          } else {
            this.alert.showErrorAlert("A service of service_type " + this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.id === service.service_type)[0].service_type + " is present.", "Please be aware that this will setup two different services pointing to CDSE, with possibly repeated results.");
          }
        }
      });
    }
    if (this.showUsernameAndPassword) {
      this.addServiceForm.get('addServiceUsername')?.setValidators(
        [
          Validators.required,
          Validators.pattern(regexPatterns['add-service_username'])
        ]
      );
      this.addServiceForm.get('addServicePassword')?.setValidators(
        [
          Validators.required,
          Validators.pattern(regexPatterns['add-service_password'])
        ]
      );
      this.addServiceForm.patchValue({
        addServiceUsername: '',
        addServicePassword: ''
      })
    } else {
      this.addServiceForm.get('addServiceUsername')?.setValidators(null);
      this.addServiceForm.get('addServiceUsername')?.clearValidators();
      this.addServiceForm.get('addServiceUsername')?.setErrors(null);
      this.addServiceForm.get('addServiceUsername')?.updateValueAndValidity();

      this.addServiceForm.get('addServicePassword')?.setValidators(null);
      this.addServiceForm.get('addServicePassword')?.clearValidators();
      this.addServiceForm.get('addServicePassword')?.setErrors(null);
      this.addServiceForm.get('addServicePassword')?.updateValueAndValidity();
      this.addServiceForm.patchValue({
        addServiceUsername: 'N/D',
        addServicePassword: 'N/D'
      })
    }
  }
  onEditServiceTypeChange() {
    let tempServiceTypeId = this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.service_type === this.editServiceForm.value.editServiceType)[0].id;
    this.checkOauth2Support(tempServiceTypeId);
    if ([4, 5].includes(tempServiceTypeId)) {
      this.serviceList.forEach((service: Service) => {
        if ([4, 5].includes(service.service_type)) {
          if (service.service_type == tempServiceTypeId) {
            this.alert.showErrorAlert("Service of service_type " + this.editServiceForm.value.editServiceType + " is already present.", "Please choose another service_type.");
            this.editServiceForm.get('addServiceType')?.setErrors({incorrect: true});
            this.editServiceForm.get('addServiceType')?.markAsTouched();
          } else {
            this.alert.showErrorAlert("A service of service_type " + this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.id === service.service_type)[0].service_type + " is present.", "Please be aware that this will setup two different services pointing to CDSE, with possibly repeated results.");
          }
        }
      });
    }
    if (this.showUsernameAndPassword) {
      this.editServiceForm.get('editServiceUsername')?.setValidators(
        [
          Validators.required,
          Validators.pattern(regexPatterns['edit-service_username'])
        ]
      );
      this.editServiceForm.get('editServicePassword')?.setValidators(
        [
          Validators.required,
          Validators.pattern(regexPatterns['edit-service_password'])
        ]
      );
      this.editServiceForm.patchValue({
        editServiceUsername: '',
        editServicePassword: ''
      })
    } else {
      this.editServiceForm.get('editServiceUsername')?.setValidators(null);
      this.editServiceForm.get('editServiceUsername')?.clearValidators();
      this.editServiceForm.get('editServiceUsername')?.setErrors(null);
      this.editServiceForm.get('editServiceUsername')?.updateValueAndValidity();

      this.editServiceForm.get('editServicePassword')?.setValidators(null);
      this.editServiceForm.get('editServicePassword')?.clearValidators();
      this.editServiceForm.get('editServicePassword')?.setErrors(null);
      this.editServiceForm.get('editServicePassword')?.updateValueAndValidity();
      this.editServiceForm.patchValue({
        editServiceUsername: 'N/D',
        editServicePassword: 'N/D'
      })
    }
  }
  onAddServiceUrlChange() {
    // Remove eventual trailing /:
    if (this.addServiceForm.value.addServiceUrl.endsWith('/')) {
      this.addServiceForm.patchValue({
        addServiceUrl: this.addServiceForm.value.addServiceUrl.slice(0, -1)
      });
    }
    // Check if service_url was already used:
    this.serviceList.forEach((service: Service) => {
      if (service.service_url === this.addServiceForm.value.addServiceUrl) {
        this.alert.showErrorAlert("There’s already a service with the same Service URL: " + this.addServiceForm.value.addServiceUrl, "Please be aware that this will give repeated results.");
      }
    });
  }
  onEditServiceUrlChange() {
    // Remove eventual trailing /:
    if (this.editServiceForm.value.editServiceUrl.endsWith('/')) {
      this.editServiceForm.patchValue({
        editServiceUrl: this.editServiceForm.value.editServiceUrl.slice(0, -1)
      });
    }
    // Check if service_url was already used:
    this.serviceList.forEach((service: Service) => {
      if (service.service_url === this.editServiceForm.value.editServiceUrl) {
        this.alert.showErrorAlert("There’s already a service with the same Service URL: " + this.editServiceForm.value.editServiceUrl, "Please be aware that this will give repeated results.");
      }
    });    
  }
  onAddTokenUrlChange() {
    // Remove eventual trailing /:
    if (this.addServiceForm.value.addServiceTokenUrl.endsWith('/')) {
      this.addServiceForm.patchValue({
        addServiceTokenUrl: this.addServiceForm.value.addServiceTokenUrl.slice(0, -1)
      });
    }
  }
  onEditTokenUrlChange() {
    // Remove eventual trailing /:
    if (this.editServiceForm.value.editServiceTokenUrl.endsWith('/')) {
      this.editServiceForm.patchValue({
        editServiceTokenUrl: this.editServiceForm.value.editServiceTokenUrl.slice(0, -1)
      });
    }
  }

  addNewService() {
    this.appComponent.checkAdminCount();
    this.passwordIsVisible = false;
    document.querySelector("#addServiceModal")!.classList.remove('hidden');
    this.addServiceForm.reset();
  }

  onAddSubmit() {
    if (this.addServiceForm.invalid) {
      let controls = this.addServiceForm.controls;
      for (const [key, value] of Object.entries(controls)) {
        this.addServiceForm.controls[key].markAsTouched();
      }
      return;
    }

    let body = {
      username: this.addServiceForm.value.addServiceUsername,
      password: this.addServiceForm.value.addServicePassword,
      service_url: this.addServiceForm.value.addServiceUrl,
      service_type: this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.service_type === this.addServiceForm.value.addServiceType)[0].id,
      centre: this.centreList.filter((centre: Centre) => centre.name === this.addServiceForm.value.addServiceCentre)[0].id,
      token_url: this.serviceTypesList.filter((a: ServiceType) => a.service_type == this.addServiceForm.value.addServiceType)[0].supports_oauth2 ? this.addServiceForm.value.addServiceTokenUrl : '',
      client_id: this.serviceTypesList.filter((a: ServiceType) => a.service_type == this.addServiceForm.value.addServiceType)[0].supports_oauth2 ? this.addServiceForm.value.addServiceClientId : ''
    };
    
    this.authenticationService.addNewService(body).subscribe({
      complete: () => {
        this.onClosePressed();
        setTimeout(() => {
          this.addServiceForm.reset();
          this.refreshPage();
        }, 250);
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }

  onEditPasswordChanged() {
    if ((<HTMLInputElement>document.querySelector('#edit-service_password')).value === '') {
      this.passwordHasBeenModified = false;
      this.editServiceForm.get('editServicePassword')?.clearValidators();
      this.editServiceForm.get('editServicePassword')?.setErrors(null);
      this.editServiceForm.get('editServicePassword')?.updateValueAndValidity();
    } else {
      this.passwordHasBeenModified = true;
      this.editServiceForm.get('editServicePassword')?.setValidators([
        Validators.required,
        Validators.pattern(regexPatterns['edit-service_password'])
      ]);
    }
    this.editServiceForm.get('editServicePassword')?.updateValueAndValidity();
  }

  onEditServiceCentreChange(event: any) { 
    let editedServiceCentre = event.target.value;
    if (this.tempPrecServiceCentre === editedServiceCentre) {
      this.editServiceForm.get('editServiceCentre')?.setValidators(
        [
          Validators.required
        ]
      );
      this.editServiceForm.get('editServiceCentre')?.updateValueAndValidity();
    } else {
      this.editServiceForm.get('editServiceCentre')?.setValidators(
        [
          Validators.required,
          notAlreadyAssociatedCentreValidator(this.serviceList, this.centreList)
        ]
      );
      this.editServiceForm.get('editServiceCentre')?.updateValueAndValidity();
    }
  }
  
  editService(id: number) {
    this.appComponent.checkAdminCount();
    this.passwordIsVisible = false;
    this.passwordHasBeenModified = false;
    this.editServiceForm.get('editServicePassword')?.clearValidators();
    this.editServiceForm.get('editServicePassword')?.setErrors(null);
    this.editServiceForm.get('editServicePassword')?.updateValueAndValidity();

    document.querySelector("#editServiceModal")!.classList.remove('hidden');
    let serviceToEdit: Service = this.serviceList.filter((a: Service) => a.id === id)[0];
    if (serviceToEdit) {
      this.tempServiceIdToEdit = id;
      this.editServiceForm.patchValue({
        editServiceUsername: serviceToEdit.username,
        editServicePassword: null,
        editServiceCentre: this.centreList.filter((a: Centre) => a.id == serviceToEdit.centre)[0].name,
        editServiceType: this.serviceTypesList.filter((a: ServiceType) => a.id == serviceToEdit.service_type)[0].service_type,
        editServiceUrl: serviceToEdit.service_url,
        editServiceClientId: serviceToEdit.client_id,
        editServiceTokenUrl: serviceToEdit.token_url
      });
      this.tempPrecServiceCentre = this.editServiceForm.value.editServiceCentre;
    }

    this.checkOauth2Support(this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.id === serviceToEdit.service_type)[0].id);
  }

  onEditSubmit(id: number) {
    if (this.editServiceForm.invalid) {
      let controls = this.editServiceForm.controls;
      for (const [key, value] of Object.entries(controls)) {
        this.editServiceForm.controls[key].markAsTouched();
      }
      return;
    }
    let tempCentreId = this.centreList.filter(a => a.name == this.editServiceForm.value.editServiceCentre)[0].id;    
    let tempServiceTypeId = this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.service_type === this.editServiceForm.value.editServiceType)[0].id;
    let tempServiceId = id;
    
    if (tempServiceTypeId != this.serviceTypesList.filter(a => a.service_type == 'DHuS Back-End')[0].id) {
      for (var i = 0; i < this.serviceList.length; i++) {
        if (tempCentreId == this.serviceList[i].centre 
          && this.serviceList[i].id != tempServiceId
        ) {
          if (
            this.serviceList[i].service_type == this.serviceTypesList.filter(a => a.service_type == 'DHuS Front-End')[0].id ||
            this.serviceList[i].service_type == this.serviceTypesList.filter(a => a.service_type == 'DHuS Single Instance')[0].id
          ) {
            return;
          }
        }
      }
    }
    let body = {
      username: this.editServiceForm.value.editServiceUsername,
      service_url: this.editServiceForm.value.editServiceUrl,
      service_type: this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.service_type === this.editServiceForm.value.editServiceType)[0].id,
      centre: this.centreList.filter((centre: Centre) => centre.name === this.editServiceForm.value.editServiceCentre)[0].id,
      token_url: this.serviceTypesList.filter((a: ServiceType) => a.service_type == this.editServiceForm.value.editServiceType)[0].supports_oauth2 ? this.editServiceForm.value.editServiceTokenUrl : '',
      client_id: this.serviceTypesList.filter((a: ServiceType) => a.service_type == this.editServiceForm.value.editServiceType)[0].supports_oauth2 ? this.editServiceForm.value.editServiceClientId : '',
      password: ''
    };
    if (this.showUsernameAndPassword) {
      if ((<HTMLInputElement>document.getElementById('edit-service_password')).value !== '') {
        body.password = <string>this.editServiceForm.value.editServicePassword;
      }
    } else {
      body.password = 'N/D';
    }
    this.authenticationService.updateService(id, body).subscribe({
      complete: () => {
        this.onClosePressed();
        setTimeout(() => {
          this.editServiceForm.reset();
          this.tempPrecServiceCentre = this.editServiceForm.value.editServiceCentre;
          this.refreshPage();
        }, 250);
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    })
  }

  deleteService(id: number) {
    this.appComponent.checkAdminCount();
    this.tempServiceIdToDelete = id;
    this.tempServiceUrlToDelete = this.serviceList.filter(a => a.id == id)[0].service_url;
    document.querySelector("#deleteServiceModal")!.classList.remove('hidden');
  }

  deleteServiceConfirmed() {
    this.authenticationService.deleteService(this.tempServiceIdToDelete).subscribe({
      complete: () => {
        this.tempServiceIdToDelete = -1;
        this.onClosePressed();
        this.refreshPage();
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }

  togglePasswordVisibility() {
    this.passwordIsVisible = !this.passwordIsVisible;
    if (!document.querySelector('#editServiceModal')?.classList.contains('hidden') && (<HTMLInputElement>document.querySelector('#edit-service_password')).value === '') {
      this.passwordHasBeenModified = false;
      setTimeout(() => {
        this.editServiceForm.get('editServicePassword')?.clearValidators();
        this.editServiceForm.get('editServicePassword')?.setErrors(null);
        this.editServiceForm.get('editServicePassword')?.updateValueAndValidity();
      }, 0);
    }
  }

  onClosePressed() {
    this.tempServiceIdToDelete = -1;
    let modals = document.querySelectorAll('.modal');
    [].forEach.call(modals, (modal: HTMLElement) => {
      modal.classList.add('hidden');
    })
  }

  getServiceTypeName(id: number) {
    if (this.serviceTypesList.length == 0) return '';
    let serviceTypeName = this.serviceTypesList.filter((serviceType: ServiceType) => serviceType.id == id)[0].service_type;
    if (serviceTypeName == undefined) return '';
    return serviceTypeName;
  }

  getCentreName(id: number) {
    if (this.centreList.length == 0) return '';
    let centreName = this.centreList.filter((centre: Centre) => centre.id == id)[0].name;
    if (centreName == undefined) return '';
    return centreName;
  }

  checkOauth2Support(id: number) {
    if (id) {
      this.showOauth2Fields = this.serviceTypesList.filter((a: ServiceType) => a.id == id)[0].supports_oauth2;
      this.showUsernameAndPassword = id !== 4;
    }
  }

  refreshPage() {
    this.getAllServiceTypes();
    this.getServices(true);
  }
}
