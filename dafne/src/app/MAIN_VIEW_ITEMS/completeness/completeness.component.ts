import { Component, OnInit, ElementRef, AfterViewInit, OnDestroy} from '@angular/core';
import * as p5 from 'p5';
import { AuthenticationService } from '../../services/authentication.service';
import { AppConfig } from '../../services/app.config';
import { IDatePickerConfig } from 'ng2-date-picker';
import { CsvDataService } from '../../services/csv-data.service';
import { Centre } from '../../models/centre';
import { AlertComponent } from '../../alert/alert.component';
import { MessageService } from '../../services/message.service';
import { NavigationEnd, Router } from '@angular/router';
import { stringify } from 'querystring';

declare var $: any;

$(window).resize(function() {
  $('#main-column-container').attr('style', '');
  $('#p5Canvas-column-div').attr('style', '');
  $('#data-table-container').attr('style', '');
});

@Component({
  selector: 'app-completeness',
  templateUrl: './completeness.component.html',
  styleUrls: ['./completeness.component.css']
})
export class CompletenessComponent implements OnInit, AfterViewInit, OnDestroy {
  navigationSubscription;

  public debugCompleteness = [
    {
      "date": "2022-06-15",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4800     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4400     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4200     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4500     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 5100     }
      ]
    },
    {
      "date": "2022-06-16",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4850     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4450     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4100     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4300     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 5200     }
      ]
    },
    {
      "date": "2022-06-17",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4700     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4500     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4300     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4800     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 4100     }
      ]
    },
    {
      "date": "2022-06-18",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4900     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4100     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4700     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4550     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 5200     }
      ]
    },
    {
      "date": "2022-06-19",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4200     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4800     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 3200     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 3500     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 4100     }
      ]
    },
    {
      "date": "2022-06-20",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 5100     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 3900     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 3300     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4100     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 4700     }
      ]
    },
    {
      "date": "2022-06-21",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4600     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4900     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4000     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4550     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 5000     }
      ]
    },
    {
      "date": "2022-06-22",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4350     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4150     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4850     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4150     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 4600     }
      ]
    },
    {
      "date": "2022-06-23",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 3900     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 3700     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4050     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4900     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 4700     }
      ]
    },
    {
      "date": "2022-06-24",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 5200     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 5400     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 5250     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 5500     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 5350     }
      ]
    },
    {
      "date": "2022-06-25",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4900     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4700     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4300     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4850     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 4100     }
      ]
    },
    {
      "date": "2022-06-26",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4900     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4750     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4550     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4150     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 4800     }
      ]
    },
    {
      "date": "2022-06-27",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 3800     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 3400     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 3900     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 3600     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 3900     }
      ]
    },
    {
      "date": "2022-06-28",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4850     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4450     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4250     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4550     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 5150     }
      ]
    },
    {
      "date": "2022-06-29",
      "values": [
        { "id": 2,  "name": "Austria EODC",          "color": "#4381C1", "local": null, "value": 4900     },
        { "id": 3,  "name": "Czech Republic CESNET", "color": "#F5D547", "local": null, "value": 4200     },
        { "id": 36, "name": "DAS-Cat01",             "color": "#b4ffee", "local": null, "value": 4900     },
        { "id": 4,  "name": "Greece NOA",            "color": "#D3F3EE", "local": true, "value": 4300     },
        { "id": 37, "name": "DAS-Cat02",             "color": "#ffbe6f", "local": null, "value": 4800     }
      ]
    }
  ]

  public p5Chart;
  public serviceList: any;
  public completenessDataList: any;
  public completenessDailyDataList: object[] = [];
  public completenessDailyGetDone: boolean[] = [];
  public tempDaysNumber: number = 0;
  public daysNumber: number = 0;
  public sectionRadians: number = 0;
  public allCentreList;
  public remoteCentreList;
  public serviceLocalCentre = new Centre;
  public serviceRemoteCentreList = [];
  public serviceAllCentreList = [];
  public localCentre;
  public totalMissionList = AppConfig.settings.satelliteList;
  public missionFiltered = this.totalMissionList[0];
  public productTypeFiltered = this.missionFiltered.productType[0];
  public missionName: string = this.missionFiltered.name;
  public productType: string = this.productTypeFiltered;
  public platformNumberList = this.missionFiltered.platform[0];
  public platformNumber: string = this.platformNumberList[0];
  public platformNumberFiltered: string = this.platformNumber;
  public filter: string;
  public tempFilter: string;
  public syncList = [];
  public syncBackendLength: number;
  public syncBackendLengthArray = [];
  public serviceUrlBackendList = [];
  public intelligentSyncSupported = [];
  public bodyMission: string;

  public siSynchronizers = []
  public feSynchronizers = []
  public beSynchronizers = []
  public serviceTypeList = []
  public serviceType: string;
  public serviceTypeChoosen: number = 1;
  public choosenSync: string;
  public canSubmit: boolean = true;

  public today = new Date();
  public todayDate: string = this.today.toISOString().slice(0, 10);

  public millisPerDay = 86400000;
  public maxDays = 14;
  public millisPerMaxPeriod = this.millisPerDay * this.maxDays;

  public initialStartDayMillis = Date.parse(this.todayDate) - (this.maxDays * this.millisPerDay);
  public startDateTemp = new Date(this.initialStartDayMillis);
  public startDate: string = this.startDateTemp.toISOString().slice(0, 10);

  public stopDate = this.todayDate;
  public startDatePickerConfig: IDatePickerConfig = {
    format: "YYYY-MM-DD",
    firstDayOfWeek: "mo",
    min: "2010-01-01",
    max: this.todayDate
  };
  public stopDatePickerConfig: IDatePickerConfig = {
    format: "YYYY-MM-DD",
    firstDayOfWeek: "mo",
    min: "2010-01-01",
    max: this.todayDate
  };

  public selectorText = [
    "Sunburst Single",
    "Sunburst Stacked",
    "Single Bars",
    "Stacked Bars",
    "Marimekko"
  ];
  public chartType: string = this.selectorText[2];
  public doResetZoom: boolean = false;
  public centreNumber: number = 0;

  public useSyncFilter: boolean = false;
  public useSyncFilterForTable: boolean = null;

  constructor(
    private el: ElementRef,
    private authenticationService: AuthenticationService,
    private csvService: CsvDataService,
    private alert: AlertComponent,
    private messageService: MessageService,
    private router: Router
  ) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        this.centreNumber = 0;
        this.serviceAllCentreList = [];
        this.getServices();
      }
    });
    this.authenticationService.getAllServiceTypes().subscribe(
      (res: any) => {
        this.serviceTypeList = res.filter(a => a.id < 4).sort(this.getSortOrder("id"));
        this.serviceTypeList.push({
          "id": 99,
          "service_type": "All",
          "createdAt": "",
          "updatedAt": ""
        });
      }
    )
  }

  ngOnInit(): void {
    this.init_P5();
  }

  ngAfterViewInit(): any {
    this.messageService.currentMessage.subscribe(message => {
      if (message == 'resize') {
        this.p5Chart.windowResized();
      }
    });
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {  
       this.navigationSubscription.unsubscribe();
    }
  }

  getServices():any {
    this.authenticationService.getAllServices().subscribe(
      (res: any) => {
        /* Filter services with service_type != Back-End */
        this.serviceList = res.filter(a => a.service_type != 3);
        
        for (var i = 0; i < this.serviceList.length; i++) {
          this.serviceList[i].service_type_id = this.serviceList[i].service_type
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
        this.allCentreList = res;
        
        /* Sort allCentreList by ID */
        this.allCentreList.sort(this.getSortOrder("id"));
        for (var i = 0; i < this.serviceList.length; i++) {

          /* Change Centre.IDs to Centre.Names into serviceList[].name */
          this.serviceList[i].centre = this.allCentreList.filter(a => a.id == this.serviceList[i].centre)[0].name;
          
          /* Copy service centres one by one into tempServiceCentre */
          let tempServiceCentre = this.allCentreList.filter(a => a.name == this.serviceList[i].centre)[0];

          /* Add "is-CSC-flag" for every centre */
          tempServiceCentre.isCSC = false;
          if (tempServiceCentre.name == this.serviceList[i].centre && this.serviceList[i].service_type_id > 3) {      
            tempServiceCentre.isCSC = true;
          }

          /* Copy tempServiceCentre first into a complete list... */
          this.serviceAllCentreList.push(tempServiceCentre);
    
          /* ...and then separate the local into 'serviceLocalCentre' and the remotes into 'serviceRemoteCentreList' */
          (tempServiceCentre.local) ? this.serviceLocalCentre = tempServiceCentre : this.serviceRemoteCentreList.push(tempServiceCentre);
        }
        /* Sort serviceAllCentreList by IDs and then set Local first */
        this.serviceAllCentreList.sort(this.getSortOrder("id"));
        this.setLocalFirst(this.serviceAllCentreList);
        
        /* Sort All Centres to put CSC at the end */
        this.serviceAllCentreList.sort(this.getSortOrder("isCSC"));
        
        /* Sort serviceRemoteCentreList[] by ID */
        this.serviceRemoteCentreList.sort(this.getSortOrder("id"));

        /* Sort Remote Centres to put CSC at the end */
        this.serviceRemoteCentreList.sort(this.getSortOrder("isCSC"));
        
        /* Get complete Centre List (also those without a service..) and copy into 'remoteCentreList[]' */
        this.remoteCentreList = Object.values(res).filter((x) => x.local === null);

        /* Get the local Centre and copy into 'localCentre' */
        if (Object.values(res).filter((x) => x.local === true)[0]) {
          this.localCentre = Object.values(res).filter((x) => x.local === true)[0];
        } else {
          /* If there's no local configured set a blank one. */
          this.localCentre = {
            id: 0,
            name: '',
            description: '',
            local: null,
            icon: 'place',
            color: 'white',
            latitude: '0.0',
            longitude: '0.0',
            isCSC: false
          };
        }

        this.getSynchronizers();
      }
    );
  }

  getSynchronizers() {
    this.authenticationService.getSISynchronizers().subscribe(
      (res: any) => {
        for (var i = 0; i < Object.keys(res).length; i++) {
          for (var k = 0; k < res[i].synchronizers.length; k++) {
            res[i].synchronizers[k].serviceUrl = res[i].serviceUrl;
            this.siSynchronizers.push(res[i].synchronizers[k]);
          }
        }
      }
    );
    this.authenticationService.getFESynchronizers().subscribe(
      (res: any) => {        
        for (var i = 0; i < Object.keys(res).length; i++) {
          for (var k = 0; k < res[i].synchronizers.length; k++) {
            res[i].synchronizers[k].serviceUrl = res[i].serviceUrl;
            this.feSynchronizers.push(res[i].synchronizers[k])
          }
        }
      }
    );
    this.authenticationService.getBESynchronizers().subscribe(
      (res: any) => {        
        for (var i = 0; i < Object.keys(res).length; i++) {
          for (var k = 0; k < res[i].synchronizers.length; k++) {
            res[i].synchronizers[k].serviceUrl = res[i].serviceUrl;
            this.beSynchronizers.push(res[i].synchronizers[k])
          }
        }
      }
    );
  }

  onUseFilterCheckboxChange() {
    var chkBox = <HTMLInputElement>document.getElementById('use-filter-checkbox');
    this.useSyncFilter = chkBox.checked;
    if (this.useSyncFilter) {
      /* Set initial status for sync filters */
      this.serviceTypeChoosen = 1;
      if (this.siSynchronizers[0]) {
        this.choosenSync = this.siSynchronizers[0].Label
        this.tempFilter = this.siSynchronizers[0].FilterParam
        this.canSubmit = true
      } else {
        this.tempFilter = "NaN"
        this.canSubmit = false
      }
    } else {
      /* Set initial status for manual filters */
      this.missionFiltered = this.totalMissionList[0];
      this.productTypeFiltered = this.missionFiltered.productType[0];
      this.missionName = this.missionFiltered.name;
      this.productType = this.productTypeFiltered;
      this.platformNumberList = this.missionFiltered.platform[0];
      this.platformNumber = this.platformNumberList[0];
      this.platformNumberFiltered = this.platformNumber;

      this.canSubmit = true
    }
  }

  onServiceTypeChange(serviceType) {
    if (serviceType.target.value == this.serviceTypeList[0].service_type) {  //Single Instance
      this.serviceTypeChoosen = 1;
      if (this.siSynchronizers[0]) {
        this.choosenSync = this.siSynchronizers[0].Label
        this.tempFilter = this.siSynchronizers[0].FilterParam
        this.canSubmit = true
      } else {
        this.tempFilter = "NaN"
        this.canSubmit = false
      }
    } else if (serviceType.target.value == this.serviceTypeList[1].service_type) { // Front-End
      this.serviceTypeChoosen = 2;
      if (this.feSynchronizers[0]) {
        this.choosenSync = this.feSynchronizers[0].Label
        this.tempFilter = this.feSynchronizers[0].FilterParam
        this.canSubmit = true
      } else {
        this.tempFilter = "NaN"
        this.canSubmit = false
      }
    } else if (serviceType.target.value == this.serviceTypeList[2].service_type) { // Back-End
      this.serviceTypeChoosen = 3;
      if (this.beSynchronizers[0]) {
        this.choosenSync = this.beSynchronizers[0].Label
        this.tempFilter = this.beSynchronizers[0].FilterParam
        this.canSubmit = true
      } else {
        this.tempFilter = "NaN"
        this.canSubmit = false
      }
    } else if (serviceType.target.value == this.serviceTypeList[3].service_type) {  // All..
      this.serviceTypeChoosen = 4;
      if (this.siSynchronizers[0]) {
        this.choosenSync = this.siSynchronizers[0].Label
        this.tempFilter = this.siSynchronizers[0].FilterParam
        this.canSubmit = true
      } else if (this.feSynchronizers[0]) {
        this.choosenSync = this.feSynchronizers[0].Label
        this.tempFilter = this.feSynchronizers[0].FilterParam
        this.canSubmit = true
      } else if (this.beSynchronizers[0]) {
        this.choosenSync = this.beSynchronizers[0].Label
        this.tempFilter = this.beSynchronizers[0].FilterParam
        this.canSubmit = true
      } else {
        this.tempFilter = "NaN"
        this.canSubmit = false
      }
    }
  }

  onSyncChange(sync) {
    this.choosenSync = sync.target.value;
    let tempF;
    tempF = this.siSynchronizers.filter(a => a.Label == sync.target.value)[0];
    if (tempF !== undefined) {
      this.tempFilter = tempF.FilterParam;
      return;
    }
    tempF = this.feSynchronizers.filter(a => a.Label == sync.target.value)[0];
    if (tempF !== undefined) {
      this.tempFilter = tempF.FilterParam;
      return;
    }
    tempF = this.beSynchronizers.filter(a => a.Label == sync.target.value)[0];
    if (tempF !== undefined) {
      this.tempFilter = tempF.FilterParam;
      return;
    }
  }

  onMissionChange(mission) {
    this.missionFiltered = this.totalMissionList.filter(a => a.name == mission.target.value)[0];
    this.productTypeFiltered = this.missionFiltered.productType[0];
    this.platformNumberFiltered = this.missionFiltered.platform[0];
  }

  onProductTypeChange(product_type) {
    this.productTypeFiltered = product_type.target.value;
  }

  onPlatformNumberChange(platform_number) {
    this.platformNumberFiltered = platform_number.target.value;
    if (this.platformNumberFiltered == 'A+B' || this.platformNumberFiltered == '---') {
      this.platformNumberFiltered = '';
    }
  }

  onFilterSubmit(): void {
    if (this.canSubmit) {
      if (this.useSyncFilter == true) {
        let tempStopDate = new Date(this.stopDate);
        let tempStartDate = new Date(this.startDate);
        let tempTimeDifference = tempStopDate.getTime() - tempStartDate.getTime();
        this.tempDaysNumber = tempTimeDifference / (1000 * 3600 * 24) + 1;

        for (var i = 0; i < this.tempDaysNumber; i++) {
          let tempFilteredDate = new Date(tempStartDate.getTime() + i*(1000*3600*24));
          let tempFilteredDateString: string = tempFilteredDate.toISOString().slice(0, 10);

          let body: object = {
            "filter":this.tempFilter,
            "startDate":tempFilteredDateString,
            "stopDate":tempFilteredDateString
          };
          this.completenessDailyGetDone[i] = false;   
          this.getDailyCompleteness(body, i);
        }
      } else {
        /* Get values from filters: */
        this.missionName = this.missionFiltered.name;
        this.productType = this.productTypeFiltered;
        if (this.platformNumberFiltered == '---') {
          this.platformNumber = '';
        } else {
          this.platformNumber = this.platformNumberFiltered;
        }
        this.bodyMission = this.missionFiltered.acronym + this.platformNumber;
        let tempStopDate = new Date(this.stopDate);
        let tempStartDate = new Date(this.startDate);
        let tempTimeDifference = tempStopDate.getTime() - tempStartDate.getTime();
        this.tempDaysNumber = tempTimeDifference / (1000 * 3600 * 24) + 1;
      
        for (var i = 0; i < this.tempDaysNumber; i++) {
          let tempFilteredDate = new Date(tempStartDate.getTime() + i*(1000*3600*24));
          let tempFilteredDateString: string = tempFilteredDate.toISOString().slice(0, 10);

          let body: object = {
            "mission":this.bodyMission,
            "productType":this.productType,
            "startDate":tempFilteredDateString,
            "stopDate":tempFilteredDateString
          };
          this.completenessDailyGetDone[i] = false;   
          this.getDailyCompleteness(body, i);
        }
      }
    } else {
      this.alert.showErrorAlert("No synchronizers configured for the selected service type", "Please select another service type");
    }
  }

  getDailyCompleteness(body, index) {
    if (this.useSyncFilter == true) {
      this.authenticationService.getFilterCompleteness(body).subscribe(
        (res: object) => {
          if (res) {
            this.completenessDailyDataList[index] = res;
            this.completenessDailyGetDone[index] = true;
            this.sumDailyCompleteness();
          } else {
            this.completenessDailyDataList[index] = [];
          }
          this.useSyncFilterForTable = this.useSyncFilter
          this.filter = this.tempFilter;
        }
      );
    } else {
      this.authenticationService.getCompleteness(body).subscribe(
        (res: object) => {
          if (res) {
            this.completenessDailyDataList[index] = res;
            this.completenessDailyGetDone[index] = true;
            this.sumDailyCompleteness();
          } else {
            this.completenessDailyDataList[index] = [];
          }
          this.useSyncFilterForTable = this.useSyncFilter
        }
      );
    }
  }

  sumDailyCompleteness() {
    for (var i = 0; i < this.tempDaysNumber; i++) {
      if (this.completenessDailyGetDone[i] == false) {
        return;
      }
    }
    
    let tempJsonCompleteness:object[] = [];
    for (var i = 0; i < this.tempDaysNumber; i++) {
      tempJsonCompleteness.push(this.completenessDailyDataList[i][0]);
    }
    //this.completenessDataList = tempJsonCompleteness;

    this.completenessDataList = this.debugCompleteness;
    
    for (var i = 0; i < this.completenessDataList.length; i++) {
      for (var k = 0; k < this.completenessDataList[i].values.length; k++) {
        this.completenessDataList[i].values[k].isCSC = this.serviceAllCentreList.filter(a => a.id == this.completenessDataList[i].values[k].id)[0].isCSC;
      }
    }
    /* Sort completeness by ID, then set Local first, then put CSC services at the end*/
    for (var i = 0; i < this.completenessDataList.length; i++) {
      this.completenessDataList[i].values.sort(this.getSortOrder("id"));
      this.setLocalFirst(this.completenessDataList[i].values);
      this.completenessDataList[i].values.sort(this.getSortOrder("isCSC"));
    }
    this.daysNumber = this.tempDaysNumber;
    this.sectionRadians = (2 * Math.PI) / this.daysNumber;
    if (this.useSyncFilter) {
      this.centreNumber = this.completenessDataList[0].values.length;
    } else {
      this.centreNumber = this.serviceAllCentreList.length;
    }
  }

  onStartDateChanged(date) {
    let tempMillisDate = (Date.parse(date) + this.millisPerMaxPeriod);
    if (Date.parse(this.stopDate) > tempMillisDate) {
      this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 15 days");
      let tempDate = new Date(tempMillisDate);
      this.stopDate = tempDate.toISOString().slice(0, 10);
    }
    if (Date.parse(date) > Date.parse(this.stopDate)) {
      this.alert.showErrorAlert("Check Date Range", "Start date cannot be later than stop date");
      this.stopDate = date;
    }
  }

  onStopDateChanged(date) {
    let tempMillisDate = (Date.parse(date) - this.millisPerMaxPeriod);
    if (Date.parse(this.startDate) < tempMillisDate) {
      this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 15 days");
      let tempDate = new Date(tempMillisDate);
      this.startDate = tempDate.toISOString().slice(0, 10);
    }
    if (Date.parse(date) < Date.parse(this.startDate)) {
      this.alert.showErrorAlert("Check Date Range", "Stop date cannot be earlier than start date");
      this.startDate = date;
    }
  }

  /* Function to sort arrays of object: */    
  getSortOrder(prop) {    
    return function(a, b) {    
        if (a[prop] > b[prop]) {    
            return 1;    
        } else if (a[prop] < b[prop]) {    
            return -1;    
        }    
        return 0;    
    }    
  } 

  /* Function to put local first */
  setLocalFirst(arr) {
    let tempLocalId: number;
    if (arr.filter(a => a.local == true)[0] == undefined) {
      tempLocalId = -1;
    } else {
      tempLocalId = arr.filter(a => a.local == true)[0].id;
    }
    for (var i = 0; i < arr.length; ++i) {
      if (arr[i].id == tempLocalId) {
        let tempObj = arr[i];
        arr.splice(i, 1);
        arr.unshift(tempObj);
        break;
      }
    }
  }

  chartChangeTo(type: string) {
    this.chartType = type;
    this.doResetZoom = true;
  }

  saveAsCSV() {
    if (this.completenessDataList.length > 0) {
      var csvContent: string = '';
      var table = <HTMLTableElement>document.getElementById('data-table');
      for (var h = 0; h < table.tHead.childElementCount; h++) {
        csvContent += '"' + table.tHead.children[h].textContent + '"';
        if (h != table.tHead.childElementCount - 1) csvContent += ',';
      }
      csvContent += '\n';
      for (var r = 0; r < table.rows.length; r++) {
        for (var c = 0; c < table.rows[r].cells.length; c++) {
          csvContent += '"' + table.rows[r].cells[c].innerText + '"';
          if (!(c == (table.rows[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
        }
        r < (table.childElementCount - 1) ? csvContent += '\n' : null;
      }
      let tempCompleteCsvMissionName
      if (this.useSyncFilter) {
        tempCompleteCsvMissionName = 'Sync(' + this.choosenSync + ')';
      } else {
        tempCompleteCsvMissionName = 'Mission(' + this.missionFiltered.acronym + this.platformNumber + ')_Product(' + this.productType + ')';
      }
      this.csvService.exportToCsv(
        'DAFNE-Completeness_'
        + tempCompleteCsvMissionName 
        + '_From('
        + table.children[0].children[1].innerHTML
        + ')_To('
        + table.children[0].children[table.children[0].childElementCount - 1].innerHTML
        + ').csv', csvContent
      );
    }
  }

  toggleTable() {
    if (document.getElementById("data-table-container").style.display == "none") {
      /* Show */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem - 12rem)";
      document.getElementById("p5Canvas-column-div").style.height = "calc(100vh - 25.5rem)";
      document.getElementById("data-table-container").style.display = "block";
      this.p5Chart.windowResized();
    } else {
      /* Hide */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem)";
      document.getElementById("p5Canvas-column-div").style.height = "calc(100vh - 13.5rem)";
      document.getElementById("data-table-container").style.display = "none";
      this.p5Chart.windowResized();
    }
  }

  init_P5() {
    let canvas = document.getElementById("p5Canvas");
    let canvasSpace;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;

    this.p5Chart = new p5(p => {
      let blankXDim = 140;
      let blankYDim = 160;
      let xCenter = canvasWidth / 2;
      let yCenter = canvasHeight / 2;
      let pieExtDiameter = (canvasWidth > canvasHeight) ? canvasHeight - blankYDim : canvasWidth - blankXDim;
      let pieExtRadius = pieExtDiameter / 2;
      let chartXDim = canvasWidth - blankXDim;
      let chartYDim = canvasHeight - blankYDim;
      let chartXDim2 = chartXDim / 2;
      let chartYDim2 = chartYDim / 2;
      let nLines = 4;
      let backgroundColor = p.color('#12222f');
      let labelBackgroundColor = p.color('#12222fcc')
      let lineColor = p.color('#aaaaaa');
      let pieStrokeColor = p.color(200);
      let blankRadiusX = 25;
      let blankRadiusY = 10;
      let blankRadius2X = 2 * blankRadiusX;
      let blankRadius2Y = 2 * blankRadiusY;
      let tempSum = 0;
      let maxSumValue = 0;
      let sumDayValue = new Array<number>(this.daysNumber);
      let sumPeriodValue = 0;
      let tempSumPeriod = 0;
      let zeroDiameter = 80;
      let zeroRadius = zeroDiameter / 2;
      let pieTextRadiusGap = pieExtRadius/4;

      let dateFontSize = 12;
      let valueFontSize = 10;

      let barGapScale = 30.0;
      let sectionScaleSingle = 1.4;
      let sectionScaleStacked = 1.1;
      let barTextLimit = 20;

      let sf = 1.0;
      let tx = 0;
      let ty = 0;

      p.setup = () => {
        canvasSpace = p.createCanvas(canvasWidth, canvasHeight).parent('p5Canvas');
        p.pixelDensity(1.0);
        p.smooth();
        p.frameRate(10);
        p.textFont('NotesESA-Reg');
        
        canvasSpace.mouseWheel(e => wheelZoom(e));
        canvasSpace.doubleClicked(resetZoom);
      };

      p.draw = () => {
        p.background(backgroundColor);
        p.windowResized();
        p.translate(tx, ty);
        if (this.chartType == this.selectorText[0]) {
          p.calcValMax();
          p.fillSunburstSingleChart();
        } else if (this.chartType == this.selectorText[1]) {
          p.calcMaxSumVal();
          p.fillSunburstStackedChart();
        } else if (this.chartType == this.selectorText[2]) {
          p.calcValMax();
          p.fillSingleBarChart();
        } else if (this.chartType == this.selectorText[3]) {
          p.calcMaxSumVal();
          p.fillStackBarChart();
        } else if (this.chartType == this.selectorText[4]) {
          p.calcMaxSumVal();
          p.fillMarimekkoChart();
        }

        if (p.mouseIsPressed) {
          if (p.mouseButton === p.CENTER) {
            tx -= p.pmouseX - p.mouseX;
            ty -= p.pmouseY - p.mouseY;
          }
        }
        
        if (this.doResetZoom) {
          this.doResetZoom = false;
          resetZoom();
        }
      };
      
      function applyScale(s) {
        sf = sf * s;
        if (sf < 0.65) {
          sf = 0.65;
        } else {
          tx = p.mouseX * (1-s) + tx * s;
          ty = p.mouseY * (1-s) + ty * s;
        }        
      }

      function wheelZoom(e) {
        applyScale(e.deltaY < 0 ? 1.1 : 0.9);
        return false;
      }

      function resetZoom() {
        sf = 1.0;
        tx = 0;
        ty = 0;
      }

      p.windowResized = () => {
        canvasWidth = canvas.clientWidth;
        canvasHeight = canvas.clientHeight;
        p.resizeCanvas(canvasWidth, canvasHeight);
        canvasWidth = canvas.clientWidth * sf;
        canvasHeight = canvas.clientHeight * sf;
        if (canvasHeight < 240) canvasHeight = 240;
        xCenter = canvasWidth / 2;
        yCenter = canvasHeight / 2;
        pieExtDiameter = (canvasWidth > canvasHeight) ? canvasHeight - blankYDim : canvasWidth - blankXDim;
        pieExtRadius = pieExtDiameter / 2;
        chartXDim = (canvasWidth - blankXDim);
        chartYDim = (canvasHeight - blankYDim);
        chartXDim2 = chartXDim / 2;
        chartYDim2 = chartYDim / 2;
        pieTextRadiusGap = pieExtRadius/4;
      };

      p.calcMaxSumVal = () => {
        /* Calculate max sum value */
        maxSumValue = 0;
        for (var i = 0; i < this.daysNumber; i++) {
          for (var k = 0; k < this.centreNumber; k++) {
            if (this.completenessDataList[i].values[k].value > 0) tempSum += this.completenessDataList[i].values[k].value;
          }
          if (tempSum > maxSumValue) {
            maxSumValue = tempSum;
          }
          tempSum = 0;
        }
      }

      p.calcValMax = () => {
        /* Calc Major Value */
        maxSumValue = 0;
        for (var i = 0; i < this.daysNumber; i++) {
          for (var k = 0; k < this.centreNumber; k++) {
            if (this.completenessDataList[i].values[k].value > maxSumValue) {
              maxSumValue = this.completenessDataList[i].values[k].value;
            }
          }
        }
      }

      p.fillSunburstSingleChart = () => {
        let centreAngle = (this.sectionRadians / this.centreNumber);

        /* Mouse angle and distance calc */
        let mouseAngle = p.PI - (p.atan2((p.mouseX - tx) - xCenter, (p.mouseY - ty) - yCenter) + p.HALF_PI);
        let mouseDist = p.dist(xCenter, yCenter, (p.mouseX - tx), (p.mouseY - ty));
        let pieRadiusHover = [];
        let pieBeginHover = [];
        let isHovering = false;

        /* Draw Pie Slices*/
        for (var i = 0; i < this.daysNumber; i++) {
          /* Radial lines */
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter, yCenter, xCenter + (pieExtRadius + zeroRadius) * p.cos(this.sectionRadians * i - p.HALF_PI), yCenter + (pieExtRadius + zeroRadius) * p.sin(this.sectionRadians * i - p.HALF_PI));
          /* Arc texts */
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          p.arcText(this.completenessDataList[i].date, xCenter, yCenter, this.sectionRadians * i + this.sectionRadians / 2, -(pieExtRadius + zeroRadius + 10));
          pieRadiusHover.push([]);
          pieBeginHover.push([]);

          /* Coloured arcs */
          for (var k = 0; k < this.centreNumber; k++) {
            var pieRadius = (this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value);
            pieRadius = pieRadius * pieExtDiameter / maxSumValue;
            pieRadius += zeroDiameter;
            pieRadiusHover[i].push(pieRadius);
            var pieBegin = this.sectionRadians * i + centreAngle * k - p.HALF_PI;
            pieBeginHover[i].push(pieBegin);
            p.fill(this.serviceAllCentreList[k].color);
            p.stroke(pieStrokeColor);
            p.arc(xCenter, yCenter, pieRadius, pieRadius, pieBegin, pieBegin + centreAngle, p.PIE);
          }
        }

        /* Scheme */
        p.textSize(valueFontSize);
        p.rectMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);
        for (var i = 0; i < nLines; i++) {
          /* Circles: */
          p.noFill();
          p.stroke(lineColor);
          p.circle(xCenter, yCenter, pieExtDiameter / (nLines / (i + 1)) + zeroDiameter);
          /* Labels: */
          p.fill(labelBackgroundColor);
          p.rect(xCenter, (yCenter - pieExtRadius / (nLines / (i + 1))) - zeroRadius, blankRadius2X, blankRadius2Y, 5);
          /* Values text */
          p.textSize(valueFontSize);
          p.fill(lineColor);
          p.noStroke();
          p.text(p.int(maxSumValue / (nLines / (i + 1))), xCenter, yCenter - pieExtRadius / (nLines / (i + 1)) - zeroRadius + 1);
        }

        for (var i = 0; i < this.daysNumber; i++) {
          for (var k = 0; k < this.centreNumber; k++) {
            /* Check hover */
            let hover = mouseDist < pieRadiusHover[i][k]/2 && mouseDist > zeroRadius && mouseAngle >= pieBeginHover[i][k] && mouseAngle < pieBeginHover[i][k] + centreAngle;
            if (hover) {
              isHovering = true;
              p.fill(0, 0, 0, 127);
              p.stroke(lineColor);
              p.arc(xCenter, yCenter, pieRadiusHover[i][k], pieRadiusHover[i][k], pieBeginHover[i][k], pieBeginHover[i][k] + centreAngle);
              /* Zero Circle */
              p.stroke(pieStrokeColor);
              p.fill(backgroundColor)
              p.circle(xCenter, yCenter, zeroDiameter);
              /* Zero Label */
              p.stroke(lineColor);
              p.fill(labelBackgroundColor);
              p.rect(xCenter, yCenter - zeroRadius, blankRadius2X, blankRadius2Y, 5);
              /* Zero text */
              p.fill(lineColor);
              p.noStroke();
              p.text(0, xCenter, yCenter - zeroRadius + 1);

              /* Draw values */
              p.rectMode(p.CENTER);
              let xTextPos = p.mouseX - tx;
              let yTextPos = p.mouseY - ty - 25;
              p.fill(0, 0, 0, 127);
              p.stroke(255,255,255);
              p.rect(xTextPos, yTextPos, blankRadius2X + 10, blankRadius2Y + 10, 5);
              p.fill(255,255,255);
              p.noStroke();
              p.text(this.completenessDataList[i].values[k].value, xTextPos, yTextPos + 1);
            }
          }
        }
        if (!isHovering) {
          /* Zero Circle */
          p.stroke(pieStrokeColor);
          p.fill(backgroundColor)
          p.circle(xCenter, yCenter, zeroDiameter);
          /* Zero Label */
          p.stroke(lineColor);
          p.fill(labelBackgroundColor);
          p.rect(xCenter, yCenter - zeroRadius, blankRadius2X, blankRadius2Y, 5);
          /* Zero text */
          p.fill(lineColor);
          p.noStroke();
          p.text(0, xCenter, yCenter - zeroRadius + 1);
        }
      };

      p.fillSunburstStackedChart = () => {
        /* Mouse angle and distance calc */
        let mouseAngle = p.PI - (p.atan2((p.mouseX - tx) - xCenter, (p.mouseY - ty) - yCenter) + p.HALF_PI);
        let mouseDist = p.dist(xCenter, yCenter, (p.mouseX - tx), (p.mouseY - ty));
        let pieRadiusHover = [];
        let pieBeginHover = [];
        let isHovering = false;
        let hoveringText;

        /* Draw Pie Slices*/
        for (var i = 0; i < this.daysNumber; i++) {
          /* Radial lines */
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter, yCenter, xCenter + (pieExtRadius + zeroRadius) * p.cos(this.sectionRadians * i - p.HALF_PI), yCenter + (pieExtRadius + zeroRadius) * p.sin(this.sectionRadians * i - p.HALF_PI));
          /* Arc texts */
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          p.arcText(this.completenessDataList[i].date, xCenter, yCenter, this.sectionRadians * i + this.sectionRadians / 2, -(pieExtRadius + zeroRadius + 10));
          /* Coloured arcs calcs */
          pieRadiusHover.push([]);
          pieBeginHover.push([]);
          for (var k = 0; k < this.centreNumber; k++) {         
            var pieRadius = (this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value);
            for (var j = k + 1; j < this.centreNumber; j++) {
              if (this.completenessDataList[i].values[j].value > 0) pieRadius += this.completenessDataList[i].values[j].value;
            }
            pieRadius = pieRadius * pieExtDiameter / maxSumValue;
            pieRadius += zeroDiameter;
            pieRadiusHover[i].push(pieRadius);
            var pieBegin = this.sectionRadians * i - p.HALF_PI;
            pieBeginHover[i].push(pieBegin);
          }
        }

        for (var i = 0; i < this.daysNumber; i++) {
          for (var k = 0; k < this.centreNumber; k++) {
            /* Check hover */
            let hover = false;
            if (k == this.centreNumber - 1) {
              hover = mouseDist <= pieRadiusHover[i][k]/2 && mouseDist > zeroDiameter/2 && mouseAngle >= pieBeginHover[i][k] && mouseAngle < pieBeginHover[i][k] + this.sectionRadians;
            } else {              
              hover = mouseDist <= pieRadiusHover[i][k]/2 && mouseDist > pieRadiusHover[i][k+1]/2 && mouseAngle >= pieBeginHover[i][k] && mouseAngle < pieBeginHover[i][k] + this.sectionRadians;
            }

            /* Draw Arcs */
            p.fill(this.serviceAllCentreList[k].color);
            p.stroke(pieStrokeColor);
            p.arc(xCenter, yCenter, pieRadiusHover[i][k], pieRadiusHover[i][k], pieBeginHover[i][k], pieBeginHover[i][k] + this.sectionRadians, p.PIE);

            /* Draw Hovered Arc */
            if (hover) {             
              isHovering = true;
              hoveringText = this.completenessDataList[i].values[k].value;
              p.fill(0, 0, 0, 127);
              p.arc(xCenter, yCenter, pieRadiusHover[i][k], pieRadiusHover[i][k], pieBeginHover[i][k], pieBeginHover[i][k] + this.sectionRadians, p.PIE);
            }
          }
        }

        /* Scheme */
        p.textSize(valueFontSize);
        p.rectMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);
        for (var i = 0; i < nLines; i++) {
          /* Circles: */
          p.noFill();
          p.stroke(lineColor);
          p.circle(xCenter, yCenter, pieExtDiameter / (nLines / (i + 1)) + zeroDiameter);
          /* Labels: */
          p.fill(labelBackgroundColor);
          p.rect(xCenter, (yCenter - pieExtRadius / (nLines / (i + 1))) - zeroRadius, blankRadius2X, blankRadius2Y, 5);
          /* Values text */
          p.textSize(valueFontSize);
          p.fill(lineColor);
          p.noStroke();
          p.text(p.int(maxSumValue / (nLines / (i + 1))), xCenter, yCenter - pieExtRadius / (nLines / (i + 1)) - zeroRadius + 1);
        }
        /* Zero Circle */
        p.stroke(pieStrokeColor);
        p.fill(backgroundColor)
        p.circle(xCenter, yCenter, zeroDiameter);
        /* Zero Label */
        p.stroke(lineColor);
        p.fill(labelBackgroundColor);
        p.rect(xCenter, yCenter - zeroRadius, blankRadius2X, blankRadius2Y, 5);
        /* Zero text */
        p.fill(lineColor);
        p.noStroke();
        p.text(0, xCenter, yCenter - zeroRadius + 1);
        
        /* Draw value */
        if (isHovering) {
          p.rectMode(p.CENTER);
          let xTextPos = p.mouseX - tx;
          let yTextPos = p.mouseY - ty - 25;
          p.fill(0, 0, 0, 127);
          p.stroke(255,255,255);
          p.rect(xTextPos, yTextPos, blankRadius2X + 10, blankRadius2Y + 10, 5);
          p.fill(255,255,255);
          p.noStroke();
          p.text(hoveringText, xTextPos, yTextPos + 1);
        }
      };

      p.fillSingleBarChart = () => {
        for (var i = 0; i < this.daysNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.daysNumber) + i * chartXDim / this.daysNumber;
          let sectionXFilledDim = (chartXDim / this.daysNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;
          /* xAxis Text */
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          /* Rotate Dates */
          let tempText
          tempText = this.completenessDataList[i].date;          
          let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
          let angle = 0;
          if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
          if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
          else angle = p.PI/2;
          let sinOfAngleTemp = p.sin(angle);
          if (sinOfAngleTemp < 0.001) {
            sinOfAngleTemp = 0.001;
          }
          let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
          p.push();
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + dateFontSize);
          if (angle > p.PI / 2) angle = p.PI / 2;
          if (angle < 0) angle = 0;
          p.rotate(-angle);
          p.text(tempText, 0, 0);
          p.pop();

          /* xAxis lines */
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2);
          
          /* Bars */
          p.rectMode(p.CORNER);
          for (var k = 0; k < this.centreNumber; k++) {
            p.fill(this.serviceAllCentreList[k].color);
            p.noStroke();
            p.rect(sectionXCenter - sectionXFilledDim2 + k * sectionXFilledDim / this.centreNumber + barGap / 2, yCenter + chartYDim2, sectionXFilledDim / this.centreNumber - barGap, -((this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value) * chartYDim / maxSumValue));
          }
          for (var k = 0; k < this.centreNumber; k++) {
            p.fill(lineColor);
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(valueFontSize);
            let tempText = (this.completenessDataList[i].values[k].value < 0 ? "NaN" : this.completenessDataList[i].values[k].value);
            let tempRadium = ((sectionXFilledDim / this.centreNumber) - (2 * barGap) - valueFontSize);
            let angle = 0;
            if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
            if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
            else angle = p.PI/2;
            let sinOfAngleTemp = p.sin(angle);
            if (sinOfAngleTemp < 0.001) {
              sinOfAngleTemp = 0.001;
            }
            let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
            
            p.push();          
            p.translate(sectionXCenter - sectionXFilledDim2 + k * sectionXFilledDim / this.centreNumber + (sectionXFilledDim / (this.centreNumber * 2)), yCenter + chartYDim2 - ((this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value) * chartYDim / (maxSumValue+1)) - valueFontSize/2 - sinOfAngle - dateFontSize / 4);
            if (angle > p.PI / 2) angle = p.PI / 2;
            if (angle < 0) angle = 0;
            p.rotate(-angle);
            p.text(tempText, 0, 0);
            p.pop();
          }
        }
        /* Scheme */
        p.rectMode(p.CENTER);
        p.textAlign(p.RIGHT, p.CENTER);
        p.noFill();
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
        /* Zero text */
        p.fill(lineColor);
        p.noStroke();
        p.text(0, xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2)
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          p.text(p.int(maxSumValue / (nLines / (i + 1))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }

      p.fillStackBarChart = () => {
        for (var i = 0; i < this.daysNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.daysNumber) + i * chartXDim / this.daysNumber;
          let sectionXFilledDim = (chartXDim / this.daysNumber) / sectionScaleStacked;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;
          /* xAxis Text */
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          /* Rotate Dates */
          let tempText
          tempText = this.completenessDataList[i].date;          
          let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
          let angle = 0;
          if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
          if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
          else angle = p.PI/2;
          let sinOfAngleTemp = p.sin(angle);
          if (sinOfAngleTemp < 0.001) {
            sinOfAngleTemp = 0.001;
          }
          let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
          p.push();
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + dateFontSize);
          if (angle > p.PI / 2) angle = p.PI / 2;
          if (angle < 0) angle = 0;
          p.rotate(-angle);
          p.text(tempText, 0, 0);
          p.pop();

          /* xAxis lines */
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2);
          /* Bars */
          p.rectMode(p.CORNER);
          /* Draw stacked bars */
          for (var k = 0; k < this.centreNumber; k++) {
            var barHeight = (this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value);
            for (var j = k + 1; j < this.centreNumber; j++) {
              if (this.completenessDataList[i].values[j].value > 0) barHeight += this.completenessDataList[i].values[j].value;
            }
            barHeight = chartYDim * (barHeight) / (maxSumValue+1);
            if (barHeight == 0 || barHeight == undefined) {
              barHeight = 1;
            }
            p.fill(this.serviceAllCentreList[k].color);
            p.noStroke();
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -barHeight);
          }
          /* Write stacked values */
          for (var k = 0; k < this.centreNumber; k++) {
            var barHeight = (this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value);
            for (var j = k + 1; j < this.centreNumber; j++) {
              if (this.completenessDataList[i].values[j].value > 0) barHeight += this.completenessDataList[i].values[j].value;
            }
            barHeight = chartYDim * (barHeight) / (maxSumValue+1);
            if (barHeight == 0 || barHeight == undefined) {
              barHeight = 1;
            }
            p.fill((((this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value) * chartYDim / (maxSumValue+1)) <= barTextLimit && k == 0) ? lineColor : '#000000');
            p.noStroke();
            p.textSize(valueFontSize);
            p.textAlign(p.CENTER, p.TOP);
            p.text((this.completenessDataList[i].values[k].value < 0 ? "NaN" : (((this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value) * chartYDim / (maxSumValue+1)) > barTextLimit) ? this.completenessDataList[i].values[k].value : this.completenessDataList[i].values[k].value + p.char(0x21b4)), 
                    sectionXCenter + (((((this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value) * chartYDim / (maxSumValue+1)) > barTextLimit) || k == 0) ? 0 : 0),
                    yCenter + chartYDim2 - barHeight + ((((this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value) * chartYDim / (maxSumValue+1)) > barTextLimit) ? dateFontSize / 4 : -dateFontSize)
                  );
          }
        }
        /* Scheme */
        p.rectMode(p.CENTER);
        p.textAlign(p.RIGHT, p.CENTER);
        p.noFill();
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
        /* Zero text */
        p.fill(lineColor);
        p.noStroke();
        p.text(0, xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2)
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          p.text(p.int(maxSumValue / (nLines / (i + 1))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }

      p.fillMarimekkoChart = () => {
        sumPeriodValue = 0;
        tempSumPeriod = 0;
        for (var i = 0; i < this.daysNumber; i++) {
          sumDayValue[i] = 0;
          for (var k = 0; k < this.centreNumber; k++) {
            if (this.completenessDataList[i].values[k].value > 0) tempSum += this.completenessDataList[i].values[k].value;
          }
          if (tempSum > sumDayValue[i]) {
            sumDayValue[i] = tempSum;
          }
          tempSumPeriod += sumDayValue[i];
          if (tempSumPeriod > sumPeriodValue) {
            sumPeriodValue = tempSumPeriod;
          }
          tempSum = 0;
        }
        let sectionMinXDim = chartXDim / this.daysNumber;
        for (var i = 0; i < this.daysNumber; i++) {
          if (((sumDayValue[i]) * chartXDim / sumPeriodValue) < sectionMinXDim) {
            sectionMinXDim = ((sumDayValue[i]) * chartXDim / sumPeriodValue);
          }
        }
        let sectionXDim = new Array<number>(this.daysNumber);
        let sectionXCenter = new Array<number>(this.daysNumber);
        let tempXDimsPrec: number = 0;
        let sectionXFilledDim = new Array<number>(this.daysNumber);
        let sectionXFilledDim2 = new Array<number>(this.daysNumber);
        for (var i = 0; i < this.daysNumber; i++) {
          if (sumPeriodValue == 0 || sumPeriodValue == undefined) {
            sectionXDim[i] = chartXDim / this.daysNumber;
          } else {
            sectionXDim[i] = (sumDayValue[i]) * chartXDim / (sumPeriodValue);
          }
          sectionXCenter[i] = (xCenter - chartXDim2) + tempXDimsPrec + sectionXDim[i] / 2;

          tempXDimsPrec += sectionXDim[i];
          sectionXFilledDim[i] = sectionXDim[i] / sectionScaleStacked;
          sectionXFilledDim2[i] = sectionXFilledDim[i] / 2;
          let barGap = sectionMinXDim / barGapScale;

          /* xAxis Text */
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          if (sumDayValue[i] > 0) {
            /* Rotate Dates */
            let tempText
            tempText = this.completenessDataList[i].date;          
            let tempRadium = (sectionMinXDim - (2 * barGap) - dateFontSize);
            let angle = 0;
            if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
            if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
            else angle = p.PI/2;
            let sinOfAngleTemp = p.sin(angle);
            if (sinOfAngleTemp < 0.001) {
              sinOfAngleTemp = 0.001;
            }
            let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
            p.push();
            p.translate(sectionXCenter[i], yCenter + chartYDim2 + sinOfAngle + dateFontSize*1.5);
            if (angle > p.PI / 2) angle = p.PI / 2;
            if (angle < 0) angle = 0;
            p.rotate(-angle);
            p.text(tempText + "\n( " + sumDayValue[i] + " )", 0, 0);
            p.pop();

            /* xAxis lines */
            p.noFill();
            p.stroke(lineColor);
            p.strokeWeight(1);
            p.line(sectionXCenter[i] + sectionXDim[i] / 2, yCenter + chartYDim2 + 5, sectionXCenter[i] + sectionXDim[i] / 2, yCenter + chartYDim2);
          }
          
          /* xAxis High Text */
          if (sumDayValue[i] > 0) {
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(lineColor);
            p.noStroke();
            p.textSize(dateFontSize);
            p.text(((sumDayValue[i] != sumPeriodValue) ? (p.nf(sumDayValue[i] * 100 / (sumPeriodValue+1), 1, 1)) : 100) + "%", sectionXCenter[i], yCenter - chartYDim2 - 30);
            p.noFill();
            p.stroke(lineColor);
            p.strokeWeight(1);
            p.line(sectionXCenter[i] + sectionXDim[i] / 2, yCenter - chartYDim2 - 20, sectionXCenter[i] + sectionXDim[i] / 2, yCenter - chartYDim2 - 15);
          }

          /* Bars */
          p.rectMode(p.CORNER);
          for (var k = 0; k < this.centreNumber; k++) {
            var barHeight = (this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value);
            for (var j = k + 1; j < this.centreNumber; j++) {
              if (this.completenessDataList[i].values[j].value > 0) barHeight += this.completenessDataList[i].values[j].value;
            }
            barHeight = barHeight * chartYDim / (sumDayValue[i]);
            p.fill(this.serviceAllCentreList[k].color);
            p.stroke(backgroundColor);
            p.strokeWeight(1);
            p.rect(sectionXCenter[i] - sectionXFilledDim2[i], yCenter + chartYDim2, sectionXFilledDim[i], -barHeight);
          }
          for (var k = 0; k < this.centreNumber; k++) {
            var barHeight = (this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value);
            for (var j = k + 1; j < this.centreNumber; j++) {
              if (this.completenessDataList[i].values[j].value > 0) barHeight += this.completenessDataList[i].values[j].value;
            }
            barHeight = barHeight * chartYDim / (sumDayValue[i]);
            p.fill(((this.completenessDataList[i].values[k].value * chartYDim / (sumDayValue[i]+1)) <= barTextLimit && k == 0) ? lineColor : '#000000');
            p.noStroke();
            p.textSize(valueFontSize);
            p.textAlign(p.CENTER, p.TOP);
            p.text((this.completenessDataList[i].values[k].value < 0 ? "NaN" : ((this.completenessDataList[i].values[k].value * chartYDim / (sumDayValue[i]+1)) > barTextLimit) ? this.completenessDataList[i].values[k].value : this.completenessDataList[i].values[k].value + p.char(0x21b4)),
                    sectionXCenter[i], yCenter + chartYDim2 - barHeight + ((((this.completenessDataList[i].values[k].value < 0 ? 0 : this.completenessDataList[i].values[k].value) * chartYDim / (sumDayValue[i]+1)) > barTextLimit) ? dateFontSize / 4 : -dateFontSize)
                  );
          }
        }
        /* Scheme */
        p.rectMode(p.CENTER);
        p.textAlign(p.RIGHT, p.CENTER);
        p.noFill();
        p.stroke(lineColor);
        p.strokeWeight(1);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
        p.line(xCenter - chartXDim2, yCenter - chartYDim2 - 20, xCenter + chartXDim2, yCenter - chartYDim2 - 20);
        /* Zero text */
        p.fill(lineColor);
        p.noStroke();
        p.text(0, xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2)
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          p.text(((i + 1) * (100 / nLines)) + "%", xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }

      /* Aux Functions: */
      p.arcText = (txt: string, centerX: number, centerY: number, rotation: number, radius: number) => {
        p.textAlign(p.CENTER, p.CENTER);
        p.push();
        p.translate(centerX, centerY);
        if (rotation > p.HALF_PI && rotation < (p.PI + p.HALF_PI)) {
          radius = -radius;
          rotation += p.PI;
        }
        p.rotate(rotation);

        /* Calculate center */
        for (var i = 0; i < txt.length / 2; i++) {
          var opposite = p.textWidth(txt.charAt(i));
          p.rotate(p.atan(opposite / radius));
        }

        /* Draw text */
        for (var i = 0; i < txt.length; i++) {
          var letter = txt.charAt(i);
          opposite = p.textWidth(letter) / 2;
          p.rotate(-p.atan(opposite / radius));
          p.text(letter, 0, radius);
          p.rotate(-p.atan(opposite / radius));
        }
        p.pop();
      };

      p.setLines = (n: number) => {
        nLines = n;
      };
    }, this.el.nativeElement);
  }
}
