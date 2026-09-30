import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthenticationService } from '@app/services/authentication.service';
import { MessageService } from '@app/services/message.service';
import { Datastore, Metadatastore, Credential, Producer, Consumer } from '@app/models/models';
import { CreateDatastore, CreateMetadatastore, CreateProducer, CreateConsumer, CreateCredential } from '@app/models/element-templates';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Functions } from '@app/util/functions';
import { AlertService } from '../services/alert.service';
import { AppComponent } from '@app/app.component';
import { forkJoin, of, catchError } from 'rxjs';
import { MonacoLoaderService } from '@app/services/monaco-loader.service';
import type * as Monaco from 'monaco-editor';
import JSZip from "jszip";

@Component({
  selector: 'app-edit-ingesters',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './edit-ingesters.component.html',
  styleUrl: './edit-ingesters.component.scss'
})
export class EditIngestersComponent implements OnInit, OnDestroy {
  public datastoresList: Datastore[] = [];
  public metadatastoresList: Metadatastore[] = [];
  public credentialsList: Credential[] = [];
  public producersList: Producer[] = [];
  public consumersList: Consumer[] = [];
  public checkPermissionArrayTest: string[] = ['READ', 'WRITE', 'DELETE'];
  public datastoresTypesList: {type: string, url: string}[] = [];
  public allIngestersList: any[] = [];
  public ingestersRunning = signal<{[key: string]: boolean}>({});
  public metadatastoreClientTypeList: string[] = ['LBHttp', 'SolrCloud'];
  public producerSourceTypeList: {type: string, label: string}[] = [
    {type: 'fr.gael.gss.ingest.ingester.ProducerFolderConf', label: 'FOLDER'},
    {type: 'fr.gael.gss.admin.ingester.payload.ProducerSwiftConfPayload', label: 'SWIFT'},
    {type: 'fr.gael.gss.ingest.ingester.ProducerOdataConf', label: 'ODATA'},
    {type: 'fr.gael.gss.ingest.ingester.ProducerStacConf', label: 'STAC'},
    {type: 'fr.gael.gss.admin.ingester.payload.ProducerS3ConfPayload', label: 'S3'},
  ];
  public ODataTypeList: string[] = ['csc', 'cdse'];
  public ODataAuthTypeList: string[] = ['basic', 'oauth2'];

  public consumerSourceTypeList: {type: string, label: string}[] = [
    {type: 'fr.gael.gss.ingest.ingester.ConsumerFolderConf', label: 'FOLDER'},
    {type: 'fr.gael.gss.admin.ingester.payload.ConsumerSwiftConfPayload', label: 'SWIFT'},
    {type: 'fr.gael.gss.ingest.ingester.ConsumerOdataConf', label: 'ODATA'},
    {type: 'fr.gael.gss.ingest.ingester.ConsumerStacConf', label: 'STAC'},
    {type: 'fr.gael.gss.admin.ingester.payload.ConsumerS3ConfPayload', label: 'S3'}
  ];
  public consumerTaskList: {type: string, label: string}[] = [
    {type: 'fr.gael.gss.ingest.ingester.IngestInDataStores', label: 'Ingestion in datastore task'},
    {type: 'fr.gael.gss.ingest.ingester.ExtractMetadata', label: 'Extract metadatastore task'},
    {type: 'fr.gael.gss.ingest.ingester.IngestInMetadataStores', label: 'Ingestion in metadatastore task'},
    {type: 'fr.gael.gss.ingest.ingester.CreateQuicklook', label: 'Creation of quicklook task'}
  ];
  public consumerErrorManagerList: string[] = [
    'folder', 'swift', 's3', 'kafka'
  ];
  public credentialsTypeList: {type: string, label: string}[] = [
    {type: 'swift', label: 'SWIFT'}, 
    {type: 's3', label: 'S3'}
  ]
  public rowsToHideIfNotAdmin: string[] = [
    "user",
    "username",
    "password",
    "clientId",
    "clientSecret",
    "accessKey",
    "secretKey",
    "kafkaUser",
    "kafkaPassword"
  ];
  private onEditElementRestartIngester: boolean = false;

  public ingesterElementToEdit!: Datastore | Metadatastore | Producer | Consumer | Credential | null;
  public ingesterElementToAdd!: Datastore | Metadatastore | Producer | Consumer | Credential | null;
  public editElementJsonText: string = '';
  public addElementJsonText: string = '';
  private datastoreTypePrec: string = "";
  private metadatastoreClientTypePrec: string = "";
  private ingesterCredentialsPrec: string = "";
  private producerSourceTypePrec: string = "";
  private producerODataSourceTypePrec: string = "";
  private ingesterODataAuthTypePrec: string = "";
  private consumerSourceTypePrec: string = "";
  private consumerErrorManagerTypePrec: string = "";

  public ingesterElementInEditorType: 'datastore' | 'metadatastore' | 'producer' | 'consumer' | 'credential' | undefined;
  public ingesterElementInEditorAction: 'add' | 'edit' | undefined;
  public selectedIngester: {producer: Producer | null, consumers: Consumer[], datastores: Datastore[], metadatastores: Metadatastore[], credentials: Credential[]} = {producer: null, consumers: [], datastores: [], metadatastores: [], credentials: []};
  public selectedProducerName: string = "";
  public tempDatastoreNameToEdit: string = "";
  public tempEditor: any;
  private validateDebounceTime: number = 500;
  private originalProtectedValues: Partial<typeof this.ingesterElementToAdd> = {};
  private restoringProtectedText: boolean = false;
  private protectedKeysArray: {key: (keyof Datastore | keyof Metadatastore | keyof Producer | keyof Consumer | keyof Credential), subKey: (keyof Producer['source'] | keyof Consumer['source']) | null}[] = [
    {key: 'name', subKey: null},
    {key: 'source', subKey: 'sourceType'}
  ];
  private validateTimeoutId: any;

  private monaco!: typeof Monaco;

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private alert: AlertService,
    private appComponent: AppComponent,
    private monacoLoader: MonacoLoaderService
  ) {}

  async ngOnInit(): Promise<void> {
    this.messageService.showSpinner(true);
    this.messageService.hideSidebar(true);
    this.getIngesters();

    this.monaco = await this.monacoLoader.load();

    const tabs = document.querySelectorAll('[data-tab-target]');
    const tabContents = document.querySelectorAll('[data-tab-content]');

    [].forEach.call(tabs, (tab: HTMLElement) => {
      tab.addEventListener('click', () => {
        const prevTarget = document.querySelector(".main-page-content.active");
        const target = document.querySelector(tab.dataset['tabTarget']!);
        
        [].forEach.call(tabs, (tab: HTMLElement) => {
          tab.classList.remove('active');
        });
        tab.classList.add('active');
        prevTarget?.classList.add('fade-out');
        this.getIngesters();
        setTimeout(() => {
          if (tab.dataset['tabTarget'] == '#ingesters' ) {
            this.selectedProducerName = (<HTMLSelectElement>document.querySelector('#select-producer-for-ingester-select'))?.value || "";
            //console.log("this.selectedProducerName: ", this.selectedProducerName);
            this.showIngester(this.selectedProducerName);
          }
          [].forEach.call(tabContents, (tabContent: HTMLElement) => {
            tabContent.classList.remove('active');
          });
          prevTarget?.classList.remove('fade-out');
          target?.classList.add('active');
        }, 250);
      })
    });
  }

  isAdmin() {
    return this.authenticationService.currentUser.isAdmin;
  }
  ngOnDestroy() {
    this.cleanupMonacoInstancesAndContainers();
  }

  private filterHiddenRows(ingesterObjArray: any[]): any[] {
    if (!Array.isArray(ingesterObjArray)) return ingesterObjArray;
    return ingesterObjArray.map(item => this.removeHiddenKeysDeep(item));
  }

  private removeHiddenKeysDeep(value: any): any {
    if (Array.isArray(value)) {
      return value.map(item => this.removeHiddenKeysDeep(item));
    }

    if (value && typeof value === 'object') {
      const filteredObj: any = {};
      Object.keys(value).forEach(key => {
        if (this.rowsToHideIfNotAdmin.includes(key)) return; // salta la proprietà da nascondere
        filteredObj[key] = this.removeHiddenKeysDeep(value[key]);
      });
      return filteredObj;
    }

    // valore primitivo (string, number, boolean, null, undefined)
    return value;
  }

  async getIngesters() {
    this.authenticationService.getAllCentres().subscribe((res: object) => {
      if (Object.values(res).find((x) => x.local == true)) {
        this.authenticationService.getServiceData().subscribe({
          next: (res) => {
            forkJoin({
              datastores: this.authenticationService.getDatastores().pipe(
                catchError(err => of({ error: true, err }))
              ),
              metadatastores: this.authenticationService.getMetadatastores().pipe(
                catchError(err => of({ error: true, err }))
              ),
              credentials: this.authenticationService.getCredentials().pipe(
                catchError(err => of({ error: true, err }))
              ),
              producers: this.authenticationService.getProducers().pipe(
                catchError(err => of({ error: true, err }))
              ),
              consumers: this.authenticationService.getConsumers().pipe(
                catchError(err => of({ error: true, err }))
              ),
              datastoresTypes: this.authenticationService.getDatastoresTypesList().pipe(
                catchError(err => of({ error: true, err }))
              ),
              allIngesters: this.authenticationService.getAllIngesters().pipe(
                catchError(err => of({ error: true, err }))
              )
            }).subscribe({
              next: (res: any) => {
                const errors: any = {};
                if (res.datastores?.error) errors.datastores = res.datastores.err;
                if (res.metadatastores?.error) errors.metadatastores = res.metadatastores.err;
                if (res.credentials?.error) errors.credentials = res.credentials.err;
                if (res.producers?.error) errors.producers = res.producers.err;
                if (res.consumers?.error) errors.consumers = res.consumers.err;
                if (res.datastoresTypes?.error) errors.datastoresTypes = res.datastoresTypes.err;
                if (res.allIngesters?.error) errors.allIngesters = res.allIngesters.err;

                if (Object.keys(errors).length > 0) {
                  console.log("errors:", errors);
                }

                this.datastoresList = res.datastores.error ? [] : res.datastores;
                this.metadatastoresList = res.metadatastores.error ? [] : res.metadatastores;
                this.credentialsList = res.credentials.error ? [] : res.credentials;
                this.producersList = res.producers.error ? [] : res.producers;
                this.consumersList = res.consumers.error ? [] : res.consumers;
                this.datastoresTypesList = res.datastoresTypes.error ? [] : res.datastoresTypes;
                this.allIngestersList = res.allIngesters.error ? [] : res.allIngesters;

                //console.log("All ingesters:", this.allIngestersList);
                //console.log("this.producersList: ", this.producersList)
                this.producersList.forEach((producer: Producer) => {
                  this.ingestersRunning.update(current => ({
                    ...current,
                    [producer.name]: this.checkIfRunning(producer.name)
                  }));
                });
                this.consumersList.forEach((consumer: Consumer) => {
                  this.ingestersRunning.update(current => ({
                    ...current,
                    [consumer.name]: this.checkIfRunning(consumer.name)
                  }));
                });

                if (!this.isAdmin()) {
                  this.datastoresList = this.filterHiddenRows(this.datastoresList);
                  this.metadatastoresList = this.filterHiddenRows(this.metadatastoresList);
                  this.credentialsList = this.filterHiddenRows(this.credentialsList);
                  this.producersList = this.filterHiddenRows(this.producersList);
                  this.consumersList = this.filterHiddenRows(this.consumersList);
                  this.datastoresTypesList = this.filterHiddenRows(this.datastoresTypesList);
                }
              }
            });
          },
          error: (error) => {
            console.log("Error occurred while fetching serviceData:");
            console.error(error);
            console.error(error.status);
          }
        });
      } else {
        this.alert.showAlert("No local Centre has been set", "Please setup one Centre as local");
      }
    });
  }
  getSelectedItemProperties(selectedItem: object) {
    return Object.entries(selectedItem).map(([key, value]) => ({
      key,
      value
    }));
  }
  checkPermission(permissionArray: string[], permissionItem: string) {
    return permissionArray.includes(permissionItem);
  }
  checkIfRunning(ingesterName: string) {
    return this.allIngestersList.some((ingester: any) => ingester.name === ingesterName && ingester.state === 'RUNNING');
  }
  getIngesterStatus(ingesterName: string) {
    const ingester = this.allIngestersList.find((i: any) => i.name === ingesterName);
    return ingester && ingester.state ? ingester.state : 'N/D';
  }


  /* INGESTERS */
  showIngester(name: string) {
    //console.log("showIngester with name: ", name);
    if (this.selectedProducerName == "") {
      console.error("ERROR: showProducer(name) - name is empty.");
      return;
    }
    this.cleanupMonacoInstancesAndContainers();
    this.selectedIngester.producer = this.producersList.find((producerItem: Producer) => producerItem.name === name)!;
    const producerTopic = this.selectedIngester.producer.topic;
    const producerServiceRootUrl = this.selectedIngester.producer.source && this.selectedIngester.producer.source.serviceRootUrl ? this.selectedIngester.producer.source.serviceRootUrl : '';
    this.selectedIngester.consumers = this.consumersList.filter(
      (consumerItem: Consumer) => this.getTopicsArrayFromString(consumerItem.topics).includes(producerTopic) && consumerItem.source.serviceRootUrl === producerServiceRootUrl
    );
    const selectedDatastores = this.selectedIngester.consumers.flatMap((consumerItem: Consumer) => {
      const taskArray = consumerItem.taskList.filter(
        tl => { return tl.hasOwnProperty('targetStores') && !tl.type?.includes('MetadataStore')}
      );
     //console.log("Found Tasks FOR DATASTORES: ", taskArray);
      return taskArray.flatMap((taskItem: Consumer['taskList'][number]) => this.getTopicsArrayFromString(taskItem.targetStores ? taskItem.targetStores : ""));
    });
    this.selectedIngester.datastores = this.datastoresList.filter((datastoreItem: Datastore) => selectedDatastores.includes(datastoreItem.name));
    const selectedMetadatastores = this.selectedIngester.consumers.flatMap((consumerItem: Consumer) => {
      const taskArray = consumerItem.taskList.filter(
        tl => { return tl.hasOwnProperty('targetStores') && tl.type?.includes('MetadataStore')}
      );
     //console.log("Found Tasks FOR META_DS: ", taskArray);
      return taskArray.flatMap((taskItem: Consumer['taskList'][number]) => this.getTopicsArrayFromString(taskItem.targetStores ? taskItem.targetStores : ""));

    });
    this.selectedIngester.metadatastores = this.metadatastoresList.filter((metadatastoreItem: Metadatastore) => selectedMetadatastores.includes(metadatastoreItem.name));
    this.selectedIngester.credentials = this.credentialsList.filter((credentialItem: Credential) => this.datastoresList.flatMap((ds: Datastore) => ds.credentials).includes(credentialItem.name));

    // create containers:
    let selectedIngesterParentContainer = document.getElementById('selected-ingester-parent-container');
    if (selectedIngesterParentContainer) {
      if (this.selectedIngester.producer) {
        let producerContainer = document.createElement('div');
        producerContainer.classList.add('selected-ingester-item-container');
        producerContainer.innerHTML = `
          <div class="selected-ingester-item-title producer-bg">
            <div>PRODUCER:</div>
            <div class="selected-ingester-item-title-right-container">
              <div class="selected-ingester-item-title-name" title="`+ this.selectedIngester.producer.name +`">`+ this.selectedIngester.producer.name +`</div>`+
              (this.isAdmin() ?
              `<div class="action-icon-container" title="Edit Producer">
                <svg class="icon-edit hover-el" id="producer-edit-button">
                  <use href="assets/icons/dafne_symbols.svg#icon-edit" />
                </svg>
              </div>
              <div class="action-icon-container" title="Download Producer">
                <svg class="icon-download hover-el" id="producer-download-button">
                  <use href="assets/icons/dafne_symbols.svg#icon-download" />
                </svg>
              </div>` : ``) +
            `</div>
          </div>
        `
        let producerDiv = document.createElement('div');
        producerDiv.classList.add('selected-ingester-item-body');

        producerContainer.appendChild(producerDiv);
        selectedIngesterParentContainer.appendChild(producerContainer);

        document.querySelector('#producer-edit-button')?.addEventListener('click', () => {
          this.openIngesterElementEditor('producer', this.selectedIngester.producer!.name, 'edit');
        });
        document.querySelector('#producer-download-button')?.addEventListener('click', () => {
          this.downloadIngesterElement('producer', this.selectedIngester.producer!.name);
        });
        let producerView = this.monaco.editor.create(producerDiv, {
          language: 'json',
          value: JSON.stringify(this.selectedIngester.producer, null, 2),
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: {
            enabled: false
          },
          lineNumbers: 'off',
          formatOnPaste: true,
          formatOnType: true,
          readOnly: true
        });
      }

      if (this.selectedIngester.consumers.length > 0) {
        this.selectedIngester.consumers.forEach((consumerItem: Consumer, index: number) => {
          let consumerContainer = document.createElement('div');
          consumerContainer.classList.add('selected-ingester-item-container');
          consumerContainer.innerHTML = `
            <div class="selected-ingester-item-title consumer-bg">
              <div>CONSUMER:</div>
              <div class="selected-ingester-item-title-right-container">
                <div class="selected-ingester-item-title-name" title="`+ consumerItem.name +`">`+ consumerItem.name +`</div>`+
              (this.isAdmin() ?
              `<div class="action-icon-container" title="Edit Consumer">
                  <svg class="icon-edit hover-el" id="consumer-edit-button-`+index+`">
                    <use href="assets/icons/dafne_symbols.svg#icon-edit" />
                  </svg>
                </div>
                <div class="action-icon-container" title="Download Consumer">
                  <svg class="icon-download hover-el" id="consumer-download-button-`+index+`">
                    <use href="assets/icons/dafne_symbols.svg#icon-download" />
                  </svg>
                </div>` : ``) +
              `</div>
            </div>
          `
          let consumerDiv = document.createElement('div');
          consumerDiv.classList.add('selected-ingester-item-body');

          consumerContainer.appendChild(consumerDiv);
          selectedIngesterParentContainer.appendChild(consumerContainer);

          document.querySelector('#consumer-edit-button-'+index)?.addEventListener('click', () => {
            this.openIngesterElementEditor('consumer', consumerItem.name, 'edit');
          });
          document.querySelector('#consumer-download-button-'+index)?.addEventListener('click', () => {
            this.downloadIngesterElement('consumer', consumerItem.name);
          });

          let consumerView = this.monaco.editor.create(consumerDiv, {
            language: 'json',
            value: JSON.stringify(consumerItem, null, 2),
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
              enabled: false
            },
            lineNumbers: 'off',
            formatOnPaste: true,
            formatOnType: true,
            readOnly: true
          });
        })
      }

      if (this.selectedIngester.datastores.length > 0) {
        this.selectedIngester.datastores.forEach((datastoreItem: Datastore, index: number) => {
          let datastoreContainer = document.createElement('div');
          datastoreContainer.classList.add('selected-ingester-item-container');
          datastoreContainer.innerHTML = `
            <div class="selected-ingester-item-title datastore-bg">
              <div>DATASTORE:</div>
              <div class="selected-ingester-item-title-right-container">
                <div class="selected-ingester-item-title-name" title="`+ datastoreItem.name +`">`+ datastoreItem.name +`</div>`+
              (this.isAdmin() ?
              `<div class="action-icon-container" title="Edit Datastore">
                  <svg class="icon-edit hover-el" id="datastore-edit-button-`+index+`">
                    <use href="assets/icons/dafne_symbols.svg#icon-edit" />
                  </svg>
                </div>
                <div class="action-icon-container" title="Download Datastore">
                  <svg class="icon-download hover-el" id="datastore-download-button-`+index+`">
                    <use href="assets/icons/dafne_symbols.svg#icon-download" />
                  </svg>
                </div>` : ``) +
              `</div>
            </div>
          `
          let datastoreDiv = document.createElement('div');
          datastoreDiv.classList.add('selected-ingester-item-body');

          datastoreContainer.appendChild(datastoreDiv);
          selectedIngesterParentContainer.appendChild(datastoreContainer);

          document.querySelector('#datastore-edit-button-'+index)?.addEventListener('click', () => {
            this.openIngesterElementEditor('datastore', datastoreItem.name, 'edit');
          });
          document.querySelector('#datastore-download-button-'+index)?.addEventListener('click', () => {
            this.downloadIngesterElement('datastore', datastoreItem.name);
          });

          let datastoreView = this.monaco.editor.create(datastoreDiv, {
            language: 'json',
            value: JSON.stringify(datastoreItem, null, 2),
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
              enabled: false
            },
            lineNumbers: 'off',
            formatOnPaste: true,
            formatOnType: true,
            readOnly: true
          });
        })
      }

      if (this.selectedIngester.credentials.length > 0) {
        this.selectedIngester.credentials.forEach((credentialItem: Credential, index: number) => {
          let credentialContainer = document.createElement('div');
          credentialContainer.classList.add('selected-ingester-item-container');
          credentialContainer.innerHTML = `
            <div class="selected-ingester-item-title credential-bg">
              <div>CREDENTIAL:</div>
              <div class="selected-ingester-item-title-right-container">
                <div class="selected-ingester-item-title-name" title="`+ credentialItem.name +`">`+ credentialItem.name +`</div>`+
              (this.isAdmin() ?
              `<div class="action-icon-container" title="Edit Credential">
                  <svg class="icon-edit hover-el" id="credential-edit-button-`+index+`">
                    <use href="assets/icons/dafne_symbols.svg#icon-edit" />
                  </svg>
                </div>
                <div class="action-icon-container" title="Download Credential">
                  <svg class="icon-download hover-el" id="credential-download-button-`+index+`">
                    <use href="assets/icons/dafne_symbols.svg#icon-download" />
                  </svg>
                </div>` : ``) +
              `</div>
            </div>
          `
          let credentialDiv = document.createElement('div');
          credentialDiv.classList.add('selected-ingester-item-body');

          credentialContainer.appendChild(credentialDiv);
          selectedIngesterParentContainer.appendChild(credentialContainer);

          document.querySelector('#credential-edit-button-'+index)?.addEventListener('click', () => {
            this.openIngesterElementEditor('credential', credentialItem.name, 'edit');
          });
          document.querySelector('#credential-download-button-'+index)?.addEventListener('click', () => {
            this.downloadIngesterElement('credential', credentialItem.name);
          });

          let credentialView = this.monaco.editor.create(credentialDiv, {
            language: 'json',
            value: JSON.stringify(credentialItem, null, 2),
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
              enabled: false
            },
            lineNumbers: 'off',
            formatOnPaste: true,
            formatOnType: true,
            readOnly: true
          });
        })
      }

      if (this.selectedIngester.metadatastores.length > 0) {
        this.selectedIngester.metadatastores.forEach((metadatastoreItem: Metadatastore, index: number) => {
          let metadatastoreContainer = document.createElement('div');
          metadatastoreContainer.classList.add('selected-ingester-item-container');
          metadatastoreContainer.innerHTML = `
            <div class="selected-ingester-item-title datastore-bg">
              <div>METADATASTORE:</div>
              <div class="selected-ingester-item-title-right-container">
                <div class="selected-ingester-item-title-name" title="`+ metadatastoreItem.name +`">`+ metadatastoreItem.name +`</div>`+
              (this.isAdmin() ?
              `<div class="action-icon-container" title="Edit Metadatastore">
                  <svg class="icon-edit hover-el" id="metadatastore-edit-button-`+index+`">
                    <use href="assets/icons/dafne_symbols.svg#icon-edit" />
                  </svg>
                </div>
                <div class="action-icon-container" title="Download Metadatastore">
                  <svg class="icon-download hover-el" id="metadatastore-download-button-`+index+`">
                    <use href="assets/icons/dafne_symbols.svg#icon-download" />
                  </svg>
                </div>` : ``) +
              `</div>
            </div>
          `
          let metadatastoreDiv = document.createElement('div');
          metadatastoreDiv.classList.add('selected-ingester-item-body');

          metadatastoreContainer.appendChild(metadatastoreDiv);
          selectedIngesterParentContainer.appendChild(metadatastoreContainer);

          document.querySelector('#metadatastore-edit-button-'+index)?.addEventListener('click', () => {
            this.openIngesterElementEditor('metadatastore', metadatastoreItem.name, 'edit');
          });
          document.querySelector('#metadatastore-download-button-'+index)?.addEventListener('click', () => {
            this.downloadIngesterElement('metadatastore', metadatastoreItem.name);
          });

          let metadatastoreView = this.monaco.editor.create(metadatastoreDiv, {
            language: 'json',
            value: JSON.stringify(metadatastoreItem, null, 2),
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
              enabled: false
            },
            lineNumbers: 'off',
            formatOnPaste: true,
            formatOnType: true,
            readOnly: true
          });
        })
      }
    }

    document.querySelector('#ingester-visualise-container')?.classList.remove('hidden');
  }
  async downloadIngester() {
    if (this.selectedIngester && this.selectedIngester.producer) {
      console.log("Downloading ingester with producer name: " + this.selectedIngester.producer.name);
      //console.log("Ingester obj: ", this.selectedIngester);

      let files: {name: string, data: Object}[] = [
        {
          name: "PRODUCER_("+this.selectedIngester.producer.name+")_"+this.getTimestamp()+".json",
          data: this.selectedIngester.producer
        }
      ];
      this.selectedIngester.consumers.forEach((consumer: Consumer) => {
        files.push({
          name: "CONSUMER_("+consumer.name+")_"+this.getTimestamp()+".json",
          data: consumer
        });
      });
      this.selectedIngester.datastores.forEach((datastore: Datastore) => {
        files.push({
          name: "DATASTORE_("+datastore.name+")_"+this.getTimestamp()+".json",
          data: datastore
        });
      });
      this.selectedIngester.metadatastores.forEach((metadatastore: Metadatastore) => {
        files.push({
          name: "METADATASTORE_("+metadatastore.name+")_"+this.getTimestamp()+".json",
          data: metadatastore
        });
      });
      this.selectedIngester.credentials.forEach((credential: Credential) => {
        files.push({
          name: "CREDENTIAL_("+credential.name+")_"+this.getTimestamp()+".json",
          data: credential
        });
      });

      const zipName = "INGESTOR_("+this.selectedIngester.producer.name+")_"+this.getTimestamp()+".zip";
      const zip = new JSZip();
      files.forEach(file => {
        zip.file(
          file.name,
          JSON.stringify(file.data, null, 2)
        );
      });

      const blob = await zip.generateAsync({
        type: "blob"
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = zipName;
      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 50);
    }
  }
  downloadIngesterElement(type: string, name: string) {
    console.log("Downloading " + type + " element with name: " + name);
    const data = 
      type == 'producer' ? this.producersList.filter((producer: Producer) => producer.name == name)![0]
      : type == 'consumer' ? this.consumersList.filter((consumer: Consumer) => consumer.name == name)![0]
      : type == 'datastore' ? this.datastoresList.filter((datastore: Datastore) => datastore.name == name)![0]
      : type == 'metadatastore' ? this.metadatastoresList.filter((metadatastore: Metadatastore) => metadatastore.name == name)![0]
      : type == 'credential' ? this.credentialsList.filter((credential: Credential) => credential.name == name)![0]
      : "";
    if (data == "") {
      console.error("ERROR: downloadIngesterElement called with unknown type: " + type + " - and name: " + name);
      return;
    }
    const jsonOutputString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonOutputString], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    let tempDownloadAnchor = document.createElement('a');
    tempDownloadAnchor.href = url;
    
    tempDownloadAnchor.download = type.toUpperCase()+"_("+name+")_"+this.getTimestamp()+".json";
    tempDownloadAnchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 50);
  }
  onSelectProducerForIngesterView(event: Event) {
    this.selectedProducerName = (event.target as HTMLSelectElement).value;
    this.showIngester(this.selectedProducerName);
  }
  openIngesterElementEditor(type: 'datastore' | 'metadatastore' | 'producer' | 'consumer' | 'credential', name: string, action: 'add' | 'edit') {
    this.ingesterElementInEditorType = type;
    this.ingesterElementInEditorAction = action;
    const ingesterTab = (<HTMLElement>document.querySelector(".tab[data-tab-target='#"+(type == 'metadatastore' || type == 'credential' ? 'datastore' : type)+"s']")!);
    if (!ingesterTab.classList.contains('active')) {
      ingesterTab.click();
    } 

    this.appComponent.checkAdminCount();
    document.querySelector("#ingester-element-editor-modal")!.classList.remove('hidden');   
    this.hideAllEditorSelectors(); 
    
    let ingesterElementEditorContainer = document.getElementById('ingester-element-editor-container');

    let bgClass = "";
    if (type == 'datastore' ) {
      if (action == 'add') {
        this.ingesterElementToAdd = CreateDatastore(name, this.datastoresTypesList[0].type);
        const datastoreTypeSelectorContainer = document.querySelector('.datastore-type-selector');
        datastoreTypeSelectorContainer?.classList.remove('hidden');
        const addDatastoreTypeSelect = <HTMLSelectElement>document.querySelector('#add-datastore-type');
        addDatastoreTypeSelect.value = this.datastoresTypesList[0].type;
        setTimeout(() => {
          addDatastoreTypeSelect.dispatchEvent(new Event('change'));
        }, 0);
      } else {
        this.ingesterElementToAdd = this.datastoresList.filter((a: Datastore) => a.name === name)[0];
        this.datastoreTypePrec = this.ingesterElementToAdd.type;
        const ingesterRestartSelectorContainer = document.querySelector('.ingester-element-restart-selector');
        ingesterRestartSelectorContainer?.classList.remove('hidden');
        const addIngesterRestartSelect = <HTMLSelectElement>document.querySelector('#add-ingester-element-restart');
        addIngesterRestartSelect.value = this.onEditElementRestartIngester.toString();
      }
      bgClass = "datastore-bg";
    } else if (type == 'metadatastore') {
      if (action == 'add') {
        this.ingesterElementToAdd = CreateMetadatastore(name);
      } else {
        this.ingesterElementToAdd = this.metadatastoresList.filter((a: Metadatastore) => a.name === name)[0];
        this.metadatastoreClientTypePrec = this.ingesterElementToAdd.clientType;
        const ingesterRestartSelectorContainer = document.querySelector('.ingester-element-restart-selector');
        ingesterRestartSelectorContainer?.classList.remove('hidden');
        const addIngesterRestartSelect = <HTMLSelectElement>document.querySelector('#add-ingester-element-restart');
        addIngesterRestartSelect.value = this.onEditElementRestartIngester.toString();
      }
      const metadatastoreClientTypeSelectorContainer = document.querySelector('.metadatastore-client-type-selector');
      metadatastoreClientTypeSelectorContainer?.classList.remove('hidden');
      const addMetadatastoreClientTypeSelect = <HTMLSelectElement>document.querySelector('#add-metadatastore-client-type');
      addMetadatastoreClientTypeSelect.value = this.metadatastoreClientTypeList[0];
      setTimeout(() => {
        addMetadatastoreClientTypeSelect.dispatchEvent(new Event('change'));
      }, 0);
      bgClass = "datastore-bg";
    } else if (type == 'producer') {
      if (action == 'add') {
        this.ingesterElementToAdd = CreateProducer(name, this.producerSourceTypeList[0].type);
        const producerSourceTypeSelectorContainer = document.querySelector('.producer-source-type-selector');
        producerSourceTypeSelectorContainer?.classList.remove('hidden');
        const addProducerSourceTypeSelect = <HTMLSelectElement>document.querySelector('#add-producer-source-type');
        addProducerSourceTypeSelect.value = this.producerSourceTypeList[0].label;
        setTimeout(() => {
          addProducerSourceTypeSelect.dispatchEvent(new Event('change'));
        }, 0);
      } else {
        this.ingesterElementToAdd = this.producersList.filter((a: Producer) => a.name === name)[0];
        this.producerSourceTypePrec = this.producerSourceTypeList.filter(sourceType => sourceType.type === (<Producer>this.ingesterElementToAdd).source.sourceType!)[0]?.label;
        this.producerODataSourceTypePrec = this.ingesterElementToAdd.source.type!;
        this.ingesterODataAuthTypePrec = this.ingesterElementToAdd.source.hasOwnProperty('auth') ? (this.ingesterElementToAdd.source.auth?.hasOwnProperty('type') ? (<{type: string}>(this.ingesterElementToAdd.source.auth)).type! : "") : "";
        this.ingesterCredentialsPrec = this.ingesterElementToAdd.source.hasOwnProperty('credentials') ? this.ingesterElementToAdd.source.credentials! : "";
        const ingesterRestartSelectorContainer = document.querySelector('.ingester-element-restart-selector');
        ingesterRestartSelectorContainer?.classList.remove('hidden');
        const addIngesterRestartSelect = <HTMLSelectElement>document.querySelector('#add-ingester-element-restart');
        addIngesterRestartSelect.value = this.onEditElementRestartIngester.toString();
      }
      bgClass = "producer-bg";
    } else if (type == 'consumer') {
      if (action == 'add') {
        this.ingesterElementToAdd = CreateConsumer(name, this.consumerSourceTypeList[0].type);
        const consumerSourceTypeSelectorContainer = document.querySelector('.consumer-source-type-selector');
        consumerSourceTypeSelectorContainer?.classList.remove('hidden');
        const addConsumerSourceTypeSelect = <HTMLSelectElement>document.querySelector('#add-consumer-source-type');
        addConsumerSourceTypeSelect.value = this.consumerSourceTypeList[0].label;
        setTimeout(() => {
          addConsumerSourceTypeSelect.dispatchEvent(new Event('change'));
        }, 0);
      } else {
        this.ingesterElementToAdd = this.consumersList.filter((a: Consumer) => a.name === name)[0];
        this.consumerSourceTypePrec = this.consumerSourceTypeList.filter(sourceType => sourceType.type === (<Consumer>this.ingesterElementToAdd).source.sourceType!)[0]?.label;
        this.consumerErrorManagerTypePrec = this.ingesterElementToAdd.errorManager.type!;
        this.ingesterODataAuthTypePrec = this.ingesterElementToAdd.source.hasOwnProperty('auth') ? (<{type: string}>(this.ingesterElementToAdd.source.auth)).type! : "";
        this.ingesterCredentialsPrec = this.ingesterElementToAdd.source.hasOwnProperty('credentials') ? this.ingesterElementToAdd.source.credentials! : "";
        const ingesterRestartSelectorContainer = document.querySelector('.ingester-element-restart-selector');
        ingesterRestartSelectorContainer?.classList.remove('hidden');
        const addIngesterRestartSelect = <HTMLSelectElement>document.querySelector('#add-ingester-element-restart');
        addIngesterRestartSelect.value = this.onEditElementRestartIngester.toString();
      }
      const consumerErrorManagerTypeSelectorContainer = document.querySelector('.consumer-error-manager-type-selector');
      consumerErrorManagerTypeSelectorContainer?.classList.remove('hidden');
      bgClass = "consumer-bg";
    } else if (type == 'credential') {
      if (action == 'add') {
        this.ingesterElementToAdd = CreateCredential(name);
        const credentialsTypeSelectorContainer = document.querySelector('.credentials-type-selector');
        credentialsTypeSelectorContainer?.classList.remove('hidden');
        const addCredentialsTypeSelect = <HTMLSelectElement>document.querySelector('#add-credentials-type');
        addCredentialsTypeSelect.value = this.credentialsTypeList[0].type;
        setTimeout(() => {
          addCredentialsTypeSelect.dispatchEvent(new Event('change'));
        }, 0);
      } else {
        this.ingesterElementToAdd = this.credentialsList.filter((a: Credential) => a.name === name)[0];
      }
      bgClass = "credential-bg";
    } else {
      this.ingesterElementToAdd = null;
      bgClass = "";
    }

    if (this.ingesterElementToAdd) {
      let elementToAddContainer = document.createElement('div');
      elementToAddContainer.classList.add('ingester-element-editor-item-container');
      elementToAddContainer.innerHTML = `
        <div class="ingester-element-editor-item-title `+ bgClass +`">
          <div>`+ this.ingesterElementInEditorType?.toUpperCase() +`:</div>
          <div class="ingester-element-editor-item-title-name" title="`+ name +`">`+ name +`</div>
        </div>
      `
      let elementToAddDiv = document.createElement('div');
      elementToAddDiv.classList.add('ingester-element-editor-item-body');

      elementToAddContainer.appendChild(elementToAddDiv);
      ingesterElementEditorContainer!.appendChild(elementToAddContainer);

      this.addElementJsonText = JSON.stringify(this.ingesterElementToAdd, null, 2);
      this.tempEditor = this.monaco.editor.create(elementToAddDiv, {
        language: 'json',
        value: this.addElementJsonText,
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'monospace',
        minimap: {
          enabled: true
        },
        formatOnPaste: true,
        formatOnType: true
      });
      
      this.originalProtectedValues = {};
      if (action == 'edit') {
        for (const { key, subKey } of this.protectedKeysArray as {key: (keyof Datastore | keyof Metadatastore | keyof Producer | keyof Consumer | keyof Credential), subKey: (keyof Producer['source'] | keyof Consumer['source']) | null}[]) {
          if (key in this.ingesterElementToAdd! && this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd] !== undefined) {
            if (subKey) {
              this.originalProtectedValues![key as keyof typeof this.ingesterElementToAdd] = this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd];
              (this.originalProtectedValues![key as keyof typeof this.ingesterElementToAdd] as any)[subKey] =
                  (this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd] as any)[subKey];
            } else {
              this.originalProtectedValues![key as keyof typeof this.ingesterElementToAdd] = this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd];
            }
          }
        }
      }
      this.tempEditor.onDidChangeModelContent((e: any) => {
        clearTimeout(this.validateTimeoutId);
        this.validateTimeoutId = setTimeout(() => {
          this.validateJson(action);
        }, this.validateDebounceTime);
      });
      this.tempEditor.onDidChangeModelDecorations(() => {
        const model = this.tempEditor.getModel();
        const markers = this.monaco.editor.getModelMarkers(model);
        let errorMessage = "";
        if (markers.length > 0) {
          markers.forEach((marker: any) => {
              errorMessage += "Error: " + marker.message + " at line: " + marker.startLineNumber + "\n";
          });
          (<HTMLElement>document.querySelector('.form-button.submit')!).setAttribute('disabled', '');
        } else {
          (<HTMLElement>document.querySelector('.form-button.submit')!).removeAttribute('disabled');
        }
        document.getElementById('add-modal-validation-message')!.innerText = errorMessage;
      })          
    } else {
      console.error("ERROR: " + type + " with name: " + name + " doesn't exist");
      return;
    }
  }
  onIngestorElementODataTypeChange(event: Event) {
    const odataTypeSelected = (<HTMLSelectElement>(event.target))!.value;
    let addElementJsonObj = JSON.parse(this.addElementJsonText);
    //console.log("odataTypeSelected", odataTypeSelected);
    
    addElementJsonObj['source']['type'] = odataTypeSelected;
    if (this.ingesterElementInEditorType === 'producer') {
      if (odataTypeSelected === 'dhus' || odataTypeSelected === 'cdse') { // ['dhus', 'csc', 'cdse']
        addElementJsonObj['source']['assumedFormat'] = ".zip";
      } else if (odataTypeSelected === 'csc') {
        addElementJsonObj['source']['assumedFormat'] = null;
      }
    }

    this.producerODataSourceTypePrec = odataTypeSelected;
    this.tempEditor.setValue(JSON.stringify(addElementJsonObj, null, 2));
  }
  onIngestorElementODataAuthTypeChange(event: Event) {
    const authTypeSelected = (<HTMLSelectElement>(event.target))!.value;
    let addElementJsonObj = JSON.parse(this.addElementJsonText);
    //console.log("authTypeSelected", authTypeSelected);

    addElementJsonObj['source']['auth']['type'] = authTypeSelected;
    if (authTypeSelected === 'oauth2') {
      addElementJsonObj['source']['auth']['clientId'] = "";
      addElementJsonObj['source']['auth']['tokenEndpoint'] = "";
    } else {
      delete addElementJsonObj['source']['auth']['clientId'];
      delete addElementJsonObj['source']['auth']['tokenEndpoint'];
    }
    this.ingesterODataAuthTypePrec = authTypeSelected;
    this.tempEditor.setValue(JSON.stringify(addElementJsonObj, null, 2));
  }
  validateJson(action: string) {
    this.addElementJsonText = this.tempEditor.getValue();
    try {
      this.ingesterElementToAdd = JSON.parse(this.addElementJsonText);
    } catch {
      return;
    }

    const model = this.tempEditor.getModel();
    if (!model) return;

    const markers: Monaco.editor.IMarkerData[] = [];
    let canSubmit = true;

    // Generic checks
    if (action === 'add') {
      if (this.ingesterElementToAdd!.hasOwnProperty('name')) {
        // Handle name validation
        const tempIngesterElementName = this.ingesterElementToAdd!['name'];
        if (tempIngesterElementName === "") {
          const match = this.addElementJsonText.match(`"name":\\s*"${tempIngesterElementName}"`);
          const index = match?.index ?? 0;
          const line = model.getPositionAt(index).lineNumber;

          markers.push({
            severity: this.monaco.MarkerSeverity.Error,
            message: `Invalid element name "${tempIngesterElementName}"`,
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 999
          });
          canSubmit = false;
        } else {
        }
      }
    } else if (action == 'edit') {
      // Handle protected keys change on ingester edit
      if (this.restoringProtectedText) {
        // Avoid validation loop
        this.restoringProtectedText = false;
        this.monaco.editor.setModelMarkers(model, 'custom-validator', markers);
        return;
      }
      let protectedTextChanged = false;
    for (const { key, subKey } of this.protectedKeysArray as {key: (keyof Datastore | keyof Metadatastore | keyof Producer | keyof Consumer | keyof Credential), subKey: (keyof Producer['source'] | keyof Consumer['source']) | null}[]) {
      if (subKey && this.ingesterElementToAdd!.hasOwnProperty(key) && (this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd]! as any).hasOwnProperty(subKey)) {
        console.log("TEMP subkey:", subKey);
        if (
          JSON.stringify((this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd]! as any)[subKey]!) !== 
          JSON.stringify((this.originalProtectedValues![key as keyof typeof this.originalProtectedValues]! as any)[subKey]!)
        ) {
          (this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd] as any)[subKey] = (this.originalProtectedValues![key as keyof typeof this.ingesterElementToAdd] as any)[subKey];
          const match = this.addElementJsonText.match(`"${subKey}":\\s*"${(this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd] as any)[subKey]}"`);
          const index = match?.index ?? 0;
          const line = model.getPositionAt(index).lineNumber;

          markers.push({
            severity: this.monaco.MarkerSeverity.Error,
            message: `Cannot edit ${key} key.`,
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 999
          });
          canSubmit = false;

          protectedTextChanged = true;
        }
      } else {
        if (JSON.stringify(this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd]) !== JSON.stringify(this.originalProtectedValues![key as keyof typeof this.originalProtectedValues])) {
          this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd] = this.originalProtectedValues![key as keyof typeof this.originalProtectedValues];
          const match = this.addElementJsonText.match(`"${key}":\\s*"${this.ingesterElementToAdd![key as keyof typeof this.ingesterElementToAdd]}"`);
          const index = match?.index ?? 0;
          const line = model.getPositionAt(index).lineNumber;

          markers.push({
            severity: this.monaco.MarkerSeverity.Error,
            message: `Cannot edit ${key} key.`,
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 999
          });
          canSubmit = false;

          protectedTextChanged = true;
        }
      }
    }
      if (protectedTextChanged) {
        this.tempEditor.setValue(JSON.stringify(this.ingesterElementToAdd, null, 2));
        this.restoringProtectedText = true;
      }
    }
    if (this.ingesterElementInEditorType === 'producer') {
      const allowedSourcesTypes: string[] = this.producerSourceTypeList.flatMap(sourceType => sourceType.type);
      const allowedODataSourceTypes: string[] = this.ODataTypeList;
      const allowedODataAuthTypes: string[] = this.ODataAuthTypeList;
      const allowedCredentialsNames: string[] = this.credentialsList.flatMap(credentialEl => credentialEl.name);
      if (this.ingesterElementToAdd && this.ingesterElementToAdd.hasOwnProperty('source')) {
        if ((<Producer>this.ingesterElementToAdd)['source'].hasOwnProperty('sourceType')) {
          const tempSourceType = (<Producer>this.ingesterElementToAdd)['source']['sourceType'];
          if (tempSourceType) {
            if (!allowedSourcesTypes.includes(tempSourceType)) {
              const match = this.addElementJsonText.match(`"sourceType":\\s*"${tempSourceType}"`);
              const index = match?.index ?? 0;
              const line = model.getPositionAt(index).lineNumber;

              markers.push({
                severity: this.monaco.MarkerSeverity.Error,
                message: `Invalid producer source type "${tempSourceType}"`,
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line,
                endColumn: 999
              });
              canSubmit = false;
            } else {
              let addProducerSourceTypeSelect: HTMLSelectElement = document.querySelector('#add-producer-source-type')!;
              addProducerSourceTypeSelect.value = this.producerSourceTypeList.filter(sourceType => sourceType.type === tempSourceType)[0]?.label;
              if (tempSourceType !== this.producerSourceTypeList.filter(sourceType => sourceType.label === this.producerSourceTypePrec)[0]?.type) {
                setTimeout(() => {
                  addProducerSourceTypeSelect.dispatchEvent(new Event('change'));
                }, 0);
              }
            }
          }
        }
        if ((<Producer>this.ingesterElementToAdd)['source'].hasOwnProperty('type') && (<Producer>this.ingesterElementToAdd)['source']['type']) {
          const tempODataSourceType = (<Producer>this.ingesterElementToAdd)['source']['type'];
          if (!allowedODataSourceTypes.includes(tempODataSourceType!)) {
            const match = this.addElementJsonText.match(`"type":\\s*"${tempODataSourceType}"`);
            const index = match?.index ?? 0;
            const line = model.getPositionAt(index).lineNumber;

            markers.push({
              severity: this.monaco.MarkerSeverity.Error,
              message: `Invalid producer source type "${tempODataSourceType}"`,
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: 999
            });
            canSubmit = false;
          } else {
            let addProducerODataSourceTypeSelect: HTMLSelectElement = document.querySelector('#ingestor-element-odata-type')!;
            addProducerODataSourceTypeSelect.value = tempODataSourceType!;
            if (tempODataSourceType !== this.producerODataSourceTypePrec) {
              setTimeout(() => {
                addProducerODataSourceTypeSelect.dispatchEvent(new Event('change'));
              }, 0);
            }
          }
        }
        if ((<Producer>this.ingesterElementToAdd)['source'].hasOwnProperty('auth') && (<Producer>this.ingesterElementToAdd)['source']['auth']) {
          if ((<Producer>this.ingesterElementToAdd)['source']['auth']!.hasOwnProperty('type') && (<{type: string}>(<Producer>this.ingesterElementToAdd)['source']['auth'])['type']) {
            const tempAuthType = (<{type: string}>(<Producer>this.ingesterElementToAdd)['source']['auth'])['type'];
            if (!allowedODataAuthTypes.includes(tempAuthType)) {
              const match = this.addElementJsonText.match(`"type":\\s*"${tempAuthType}"`);
              const index = match?.index ?? 0;
              const line = model.getPositionAt(index).lineNumber;

              markers.push({
                severity: this.monaco.MarkerSeverity.Error,
                message: `Invalid OData auth type "${tempAuthType}"`,
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line,
                endColumn: 999
              });
              canSubmit = false;
            } else {
              let addProducerODataAuthTypeSelect: HTMLSelectElement = document.querySelector('#ingestor-element-odata-auth-type')!;
              addProducerODataAuthTypeSelect.value = tempAuthType;
              if (tempAuthType !== this.ingesterODataAuthTypePrec) {
                setTimeout(() => {
                  addProducerODataAuthTypeSelect.dispatchEvent(new Event('change'));
                }, 0);
              }
            }
          }
        }
        if ((<Producer>this.ingesterElementToAdd)['source'].hasOwnProperty('credentials')) {
          const tempProducerCredentials = (<Producer>this.ingesterElementToAdd)['source']['credentials'];
          if (tempProducerCredentials) {
            if (!allowedCredentialsNames.includes(tempProducerCredentials)) {
              const match = this.addElementJsonText.match(`"credentials":\\s*"${tempProducerCredentials}"`);
              const index = match?.index ?? 0;
              const line = model.getPositionAt(index).lineNumber;

              markers.push({
                severity: this.monaco.MarkerSeverity.Error,
                message: `Invalid producer source credentials name "${tempProducerCredentials}"`,
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line,
                endColumn: 999
              });
              canSubmit = false;
            } else {
              let addCredentialsNameSelect: HTMLSelectElement = document.querySelector('#ingestor-element-credentials-type')!;
              addCredentialsNameSelect.value = tempProducerCredentials;
              if (tempProducerCredentials !== this.ingesterCredentialsPrec) {
                setTimeout(() => {
                  addCredentialsNameSelect.dispatchEvent(new Event('change'));
                }, 0);
              }
            }
          }
        }
      }
    } else if (this.ingesterElementInEditorType === 'consumer') {
      const allowedSourcesTypes: string[] = this.consumerSourceTypeList.flatMap(sourceType => sourceType.type);
      const allowedTaskTypes: string[] = this.consumerTaskList.flatMap(task => task.type);
      const allowedErrorManagerTypes: string[] = this.consumerErrorManagerList;
      const allowedODataAuthTypes: string[] = this.ODataAuthTypeList;
      if (this.ingesterElementToAdd && this.ingesterElementToAdd.hasOwnProperty('source')) {
        if ((<Consumer>this.ingesterElementToAdd)['source'].hasOwnProperty('sourceType')) {
          const tempSourceType = (<Consumer>this.ingesterElementToAdd)['source']['sourceType'];
          if (tempSourceType) {
            if (!allowedSourcesTypes.includes(tempSourceType)) {
              const match = this.addElementJsonText.match(`"sourceType":\\s*"${tempSourceType}"`);
              const index = match?.index ?? 0;
              const line = model.getPositionAt(index).lineNumber;

              markers.push({
                severity: this.monaco.MarkerSeverity.Error,
                message: `Invalid consumer source type "${tempSourceType}"`,
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line,
                endColumn: 999
              });
              canSubmit = false;
            } else {
              let addConsumerSourceTypeSelect: HTMLSelectElement = document.querySelector('#add-consumer-source-type')!;
              addConsumerSourceTypeSelect.value = this.consumerSourceTypeList.filter(sourceType => sourceType.type === tempSourceType)[0]?.label;
              if (tempSourceType !== this.consumerSourceTypeList.filter(sourceType => sourceType.label === this.consumerSourceTypePrec)[0]?.type) {
                setTimeout(() => {
                  addConsumerSourceTypeSelect.dispatchEvent(new Event('change'));
                }, 0);
              }
            }
          }
        }
      }
      if ((<Consumer>this.ingesterElementToAdd).hasOwnProperty('taskList')) {
        const tempTaskList = (<Consumer>this.ingesterElementToAdd)['taskList'];
        tempTaskList.forEach((task: any) => {
          if (task.hasOwnProperty('type')) {
            const tempTaskType = task['type'];
            if (!allowedTaskTypes.includes(tempTaskType!)) {
              const match = this.addElementJsonText.match(`"type":\\s*"${tempTaskType}"`);
              const index = match?.index ?? 0;
              const line = model.getPositionAt(index).lineNumber;

              markers.push({
                severity: this.monaco.MarkerSeverity.Error,
                message: `Invalid consumer task type "${tempTaskType}"`,
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line,
                endColumn: 999
              });
              canSubmit = false;
            }
          }
        });
      };
      if ((<Consumer>this.ingesterElementToAdd).hasOwnProperty('errorManager')) {
        if ((<Consumer>this.ingesterElementToAdd)['errorManager'].hasOwnProperty('type')) {
          const errorManagerType = (<Consumer>this.ingesterElementToAdd)['errorManager']['type'];
          if (!allowedErrorManagerTypes.includes(errorManagerType!)) {
            const match = this.addElementJsonText.match(`"type":\\s*"${errorManagerType}"`);
            const index = match?.index ?? 0;
            const line = model.getPositionAt(index).lineNumber;

            markers.push({
              severity: this.monaco.MarkerSeverity.Error,
              message: `Invalid consumer error manager type "${errorManagerType}"`,
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: 999
            });
            canSubmit = false;
          } else {
            let addConsumerErrorManagerSelect: HTMLSelectElement = document.querySelector('#add-consumer-error-manager-type')!;
            addConsumerErrorManagerSelect.value = errorManagerType!;
            //console.log("addConsumerErrorManagerSelect: ", addConsumerErrorManagerSelect);
            if (errorManagerType !== this.consumerErrorManagerTypePrec) {
              setTimeout(() => {
                addConsumerErrorManagerSelect.dispatchEvent(new Event('change'));
              }, 0);
            }
          }
        }
      }
      if ((<Consumer>this.ingesterElementToAdd).hasOwnProperty('source')) {
        if ((<Consumer>this.ingesterElementToAdd)['source'].hasOwnProperty('auth')) {
          if ((<Consumer>this.ingesterElementToAdd)['source']['auth']!.hasOwnProperty('type')) {
            const sourceAuthType = (<Consumer>this.ingesterElementToAdd)['source']['auth']!['type'];
            if (!allowedODataAuthTypes.includes(sourceAuthType!)) {
              const match = this.addElementJsonText.match(`"type":\\s*"${sourceAuthType}"`);
              const index = match?.index ?? 0;
              const line = model.getPositionAt(index).lineNumber;

              markers.push({
                severity: this.monaco.MarkerSeverity.Error,
                message: `Invalid consumer source auth type "${sourceAuthType}"`,
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line,
                endColumn: 999
              });
              canSubmit = false;
            } else {
              //console.log("addConsumerODataAuthTypeSelect: ", addConsumerODataAuthTypeSelect);
              let addConsumerODataAuthTypeSelect: HTMLSelectElement = document.querySelector('#ingestor-element-odata-auth-type')!;
              addConsumerODataAuthTypeSelect.value = sourceAuthType!;
              if (sourceAuthType !== this.ingesterODataAuthTypePrec) {
                setTimeout(() => {
                  addConsumerODataAuthTypeSelect.dispatchEvent(new Event('change'));
                }, 0);
              }
            }
          }
        }
      }
    } else if (this.ingesterElementInEditorType === 'datastore') {
      const allowedDatastoreTypes: string[] = this.datastoresTypesList.flatMap(datastoreType => datastoreType.type);
      if ((<Datastore>this.ingesterElementToAdd).hasOwnProperty('type')) {
        const tempDatastoreType = (<Datastore>this.ingesterElementToAdd)['type'];
        //console.log("tempDatastoreType: ", tempDatastoreType);
        if (tempDatastoreType) {
          if (!allowedDatastoreTypes.includes(tempDatastoreType)) {
            const match = this.addElementJsonText.match(`"type":\\s*"${tempDatastoreType}"`);
            const index = match?.index ?? 0;
            const line = model.getPositionAt(index).lineNumber;

            markers.push({
              severity: this.monaco.MarkerSeverity.Error,
              message: `Invalid datastore type "${tempDatastoreType}"`,
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: 999
            });
            canSubmit = false;
          } else {
            let addDatastoreTypeSelect: HTMLSelectElement = document.querySelector('#add-datastore-type')!;
            addDatastoreTypeSelect.value = tempDatastoreType;
            if (tempDatastoreType !== this.datastoreTypePrec) {
              setTimeout(() => {
                addDatastoreTypeSelect.dispatchEvent(new Event('change'));
              }, 0);
            }
          }
        }
      }
      const allowedCredentialsNames: string[] = this.credentialsList.flatMap(credentialEl => credentialEl.name);
      if ((<Datastore>this.ingesterElementToAdd).hasOwnProperty('credentials')) {
        const tempDatastoreCredentials = (<Datastore>this.ingesterElementToAdd)['credentials'];
        //console.log("tempDatastoreCredentials: ", tempDatastoreCredentials);
        if (tempDatastoreCredentials) {
          if (!allowedCredentialsNames.includes(tempDatastoreCredentials)) {
            const match = this.addElementJsonText.match(`"credentials":\\s*"${tempDatastoreCredentials}"`);
            const index = match?.index ?? 0;
            const line = model.getPositionAt(index).lineNumber;

            markers.push({
              severity: this.monaco.MarkerSeverity.Error,
              message: `Invalid datastore credentials name "${tempDatastoreCredentials}"`,
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: 999
            });
            canSubmit = false;
          } else {
            let addCredentialsNameSelect: HTMLSelectElement = document.querySelector('#ingestor-element-credentials-type')!;
            addCredentialsNameSelect.value = tempDatastoreCredentials;
            if (tempDatastoreCredentials !== this.ingesterCredentialsPrec) {
              setTimeout(() => {
                addCredentialsNameSelect.dispatchEvent(new Event('change'));
              }, 0);
            }
          }
        }
      }
      if ((<Datastore>this.ingesterElementToAdd).hasOwnProperty('bucket')) {
        const tempDatastoreBucket = (<Datastore>this.ingesterElementToAdd)['bucket'];
        //console.log("tempDatastoreBucket: ", tempDatastoreBucket);
        if (tempDatastoreBucket === "") {
          const match = this.addElementJsonText.match(`"bucket":\\s*"${tempDatastoreBucket}"`);
          const index = match?.index ?? 0;
          const line = model.getPositionAt(index).lineNumber;

          markers.push({
            severity: this.monaco.MarkerSeverity.Error,
            message: `Invalid datastore bucket "${tempDatastoreBucket}"`,
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 999
          });
          canSubmit = false;
        } else {
        }
      }
      if ((<Datastore>this.ingesterElementToAdd).hasOwnProperty('container')) {
        const tempDatastoreContainer = (<Datastore>this.ingesterElementToAdd)['container'];
        //console.log("tempDatastoreContainer: ", tempDatastoreContainer);
        if (tempDatastoreContainer === "") {
          const match = this.addElementJsonText.match(`"container":\\s*"${tempDatastoreContainer}"`);
          const index = match?.index ?? 0;
          const line = model.getPositionAt(index).lineNumber;

          markers.push({
            severity: this.monaco.MarkerSeverity.Error,
            message: `Invalid datastore container "${tempDatastoreContainer}"`,
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 999
          });
          canSubmit = false;
        } else {
        }
      }
    } else if (this.ingesterElementInEditorType === 'metadatastore') {
      const allowedMetadatastoreClientTypes: string[] = this.metadatastoreClientTypeList;
      if ((<Metadatastore>this.ingesterElementToAdd).hasOwnProperty('clientType')) {
        const tempMetadatastoreClientType = (<Metadatastore>this.ingesterElementToAdd)['clientType'];
        //console.log("tempMetadatastoreClientType: ", tempMetadatastoreClientType);
        if (tempMetadatastoreClientType) {
          if (!allowedMetadatastoreClientTypes.includes(tempMetadatastoreClientType)) {
            const match = this.addElementJsonText.match(`"type":\\s*"${tempMetadatastoreClientType}"`);
            const index = match?.index ?? 0;
            const line = model.getPositionAt(index).lineNumber;

            markers.push({
              severity: this.monaco.MarkerSeverity.Error,
              message: `Invalid metadatastore client type "${tempMetadatastoreClientType}"`,
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: 999
            });
            canSubmit = false;
          } else {
            let addMetadatastoreClientTypeSelect: HTMLSelectElement = document.querySelector('#add-metadatastore-client-type')!;
            addMetadatastoreClientTypeSelect.value = tempMetadatastoreClientType;
            if (tempMetadatastoreClientType !== this.metadatastoreClientTypePrec) {
              setTimeout(() => {
                addMetadatastoreClientTypeSelect.dispatchEvent(new Event('change'));
              }, 0);
            }
          }
        }
      }
      if ((<Metadatastore>this.ingesterElementToAdd).hasOwnProperty('strategies') && (<Metadatastore>this.ingesterElementToAdd)['strategies']) {
        if ((<Metadatastore>this.ingesterElementToAdd)['strategies']!.hasOwnProperty('strategy')) {
          if ((!Array.isArray((<Metadatastore>this.ingesterElementToAdd)['strategies']!['strategy']) || (<Metadatastore>this.ingesterElementToAdd)['strategies']!['strategy'].length === 0)) {
            const match = this.addElementJsonText.match(`"strategy":\\s*"${(<Metadatastore>this.ingesterElementToAdd)['strategies']!['strategy']}"`);
            const index = match?.index ?? 0;
            const line = model.getPositionAt(index).lineNumber;

            markers.push({
              severity: this.monaco.MarkerSeverity.Error,
              message: `Invalid metadatastore strategy "${(<Metadatastore>this.ingesterElementToAdd)['strategies']!['strategy']}"`,
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: 999
            });
            canSubmit = false;
          }
        } else {
          const match = this.addElementJsonText.match(`"strategies":\\s*"${(<Metadatastore>this.ingesterElementToAdd)['strategies']}"`);
          const index = match?.index ?? 0;
          const line = model.getPositionAt(index).lineNumber;

          markers.push({
            severity: this.monaco.MarkerSeverity.Error,
            message: `Invalid metadatastore strategies "${(<Metadatastore>this.ingesterElementToAdd)['strategies']}"`,
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 999
          });
          canSubmit = false;
        }
      }
      if ((<Metadatastore>this.ingesterElementToAdd).hasOwnProperty('hosts') && (<Metadatastore>this.ingesterElementToAdd)['hosts'] === "") {
        const match = this.addElementJsonText.match(`"hosts":\\s*""`);
        const index = match?.index ?? 0;
        const line = model.getPositionAt(index).lineNumber;

        markers.push({
          severity: this.monaco.MarkerSeverity.Error,
          message: `Invalid metadatastore hosts "${(<Metadatastore>this.ingesterElementToAdd)['hosts']}"`,
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 999
        });
        canSubmit = false;
      }
    } else if (this.ingesterElementInEditorType === 'credential') {
      // Add Credentials validation if needed.
    }

    document.querySelector('.ingester-element-editor-item-title-name')!.innerHTML = this.ingesterElementToAdd!.name;

    this.monaco.editor.setModelMarkers(model, 'custom-validator', markers);
    if (canSubmit) {
      this.setAddIngesterElementSubmitValid();
    } else {
      this.setAddIngesterElementSubmitInvalid();
    }
  }
  onIngesterElementEditorSubmit(ingesterElement: Datastore | Metadatastore | Producer | Consumer | Credential | null) {
    if (ingesterElement) {
      //console.log("onIngesterElementEditorSubmit - ACTION: ", this.ingesterElementInEditorAction);
      console.log("Saving Ingester Element: " + ingesterElement.name + " of type: " + this.ingesterElementInEditorType);
      if (this.ingesterElementInEditorAction === 'add') {
        if (this.ingesterElementInEditorType === 'datastore') {
          this.authenticationService.createDatastore(<Datastore>ingesterElement).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        } else if (this.ingesterElementInEditorType === 'metadatastore') {
          this.authenticationService.createMetadatastore(<Metadatastore>ingesterElement).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        } else if (this.ingesterElementInEditorType === 'producer') {
          this.authenticationService.createProducer(<Producer>ingesterElement).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        } else if (this.ingesterElementInEditorType === 'consumer') {
          this.authenticationService.createConsumer(<Consumer>ingesterElement).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        } else if (this.ingesterElementInEditorType === 'credential') {
          const credentialTypeSelectElement = document.querySelector('#add-credentials-type') as HTMLSelectElement;
          const credentialsType = credentialTypeSelectElement.value;
          const credentialTypeLabel = this.credentialsTypeList.filter((item) => item.type === credentialsType)[0]?.label;
          this.authenticationService.createCredential(<Credential>ingesterElement, credentialTypeLabel).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        }
      } else if (this.ingesterElementInEditorAction === 'edit') {
        if (this.ingesterElementInEditorType === 'producer') {
          this.authenticationService.updateProducer(<Producer>ingesterElement, this.onEditElementRestartIngester).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        } else if (this.ingesterElementInEditorType === 'consumer') {
          this.authenticationService.updateConsumer(<Consumer>ingesterElement, this.onEditElementRestartIngester).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        } else if (this.ingesterElementInEditorType === 'datastore') {
          this.authenticationService.updateDatastore(<Datastore>ingesterElement, this.onEditElementRestartIngester).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        } else if (this.ingesterElementInEditorType === 'metadatastore') {
          this.authenticationService.updateMetadatastore(<Metadatastore>ingesterElement, this.onEditElementRestartIngester).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        } else if (this.ingesterElementInEditorType === 'credential') {
          const tempCredentialType = (<Credential>ingesterElement).hasOwnProperty('user') ? 'SWIFT' : 'S3';
          this.authenticationService.updateCredential(<Credential>ingesterElement, tempCredentialType).subscribe({
            next: (res) => {
              this.onClosePressed();
              setTimeout(() => {
                this.ingesterElementToAdd = null;
                this.addElementJsonText = "";
                this.refreshPage();
              }, 250);
            },
            error: (error) => {
              console.error(error);
              console.error(error.status);
            }
          });
        }
      }
    } else {
      console.error("ERROR: cannot submit a null element.");
      return;
    }
  }
  onCredentialChange(event: Event) {
    const credentialsSelected = (<HTMLSelectElement>(event.target))!.value;
    const addElementJsonObj = JSON.parse(this.addElementJsonText);
    if (addElementJsonObj.hasOwnProperty('credentials')) {
      // Datastore
      addElementJsonObj.credentials = credentialsSelected;
      this.tempEditor.setValue(JSON.stringify(addElementJsonObj, null, 2));
    } else if (addElementJsonObj.hasOwnProperty('source')) {
      // Producer
      if (addElementJsonObj.source.hasOwnProperty('credentials')) {
        addElementJsonObj.source.credentials = credentialsSelected;
        this.tempEditor.setValue(JSON.stringify(addElementJsonObj, null, 2));
      }
    }
    this.ingesterCredentialsPrec = credentialsSelected;
  }
  hideAllEditorSelectors() {
    const editorSelectors = document.querySelectorAll('.editor-selector');
    editorSelectors.forEach((selector) => {
      selector.classList.add('hidden');
    });
  }
  showCredentialsSelect() {
    const credentialsSelect = document.querySelector('.credentials-name-selector') as HTMLSelectElement;
    if (credentialsSelect) {
      credentialsSelect.classList.remove('hidden');
    }
  }
  hideCredentialsSelect() {
    const credentialsSelect = document.querySelector('.credentials-name-selector') as HTMLSelectElement;
    if (credentialsSelect) {
      credentialsSelect.classList.add('hidden');
    }
  }
  showODataTypeSelect() {
    const odataTypeSelect = document.querySelector('.ingestor-element-odata-type-selector') as HTMLSelectElement;
    if (odataTypeSelect) {
      odataTypeSelect.classList.remove('hidden');
    }
  }
  hideODataTypeSelect() {
    const odataTypeSelect = document.querySelector('.ingestor-element-odata-type-selector') as HTMLSelectElement;
    if (odataTypeSelect) {
      odataTypeSelect.classList.add('hidden');
    }
  }
  showODataAuthTypeSelect() {
    const odataAuthTypeSelect = document.querySelector('.ingestor-element-odata-auth-type-selector') as HTMLSelectElement;
    if (odataAuthTypeSelect) {
      odataAuthTypeSelect.classList.remove('hidden');
    }
  }
  hideODataAuthTypeSelect() {
    const odataAuthTypeSelect = document.querySelector('.ingestor-element-odata-auth-type-selector') as HTMLSelectElement;
    if (odataAuthTypeSelect) {
      odataAuthTypeSelect.classList.add('hidden');
    }
  }
  showErrorManagerSelect() {
    const errorManagerSelect = document.querySelector('.consumer-error-manager-type-selector') as HTMLSelectElement;
    if (errorManagerSelect) {
      errorManagerSelect.classList.remove('hidden');
    }
  }
  hideErrorManagerSelect() {
    const errorManagerSelect = document.querySelector('.consumer-error-manager-type-selector') as HTMLSelectElement;
    if (errorManagerSelect) {
      errorManagerSelect.classList.add('hidden');
    }
  }
  /* async getAllIngestersStates() {
    this.authenticationService.getAllIngesters().subscribe({
      next: (res) => {
        console.log("All ingesters states fetched successfully:");
        console.log(res);
      },
      error: (error) => {
        console.log("Error occurred while fetching serviceData:");
        console.error(error);
        console.error(error.status);
      }
    })
  } */


  /* DATASTORES */
  setAddIngesterElementSubmitValid() {
    const submitButton = document.querySelector('#add-element-submit-button') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
  setAddIngesterElementSubmitInvalid() {
    const submitButton = document.querySelector('#add-element-submit-button') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
    }
  }
  onDatastoreTypeChange(event: Event) {
    const typeSelected = (<HTMLSelectElement>(event.target))!.value;
    const addElementJsonObj = JSON.parse(this.addElementJsonText);

    let baseDatastore: Datastore = CreateDatastore(addElementJsonObj.name, typeSelected);
    const baseKeys = Object.keys(baseDatastore);
    baseKeys.forEach((key: string) => {
      if (key in baseDatastore) {
        (baseDatastore as any)[key] = addElementJsonObj[key];
      }
    });

    if (typeSelected === 'SWIFT') {
      this.showCredentialsSelect();
      const selectedCredentialsName = (<HTMLSelectElement>document.querySelector('#ingestor-element-credentials-type'))?.value;
      baseDatastore['credentials'] = selectedCredentialsName ?? "";
      baseDatastore['prefixLocation'] = "";
      baseDatastore['container'] = "container-name";
      delete baseDatastore['path'];
      delete baseDatastore['depth'];
      delete baseDatastore['granularity'];
      delete baseDatastore['parentGroup'];
    } else if (typeSelected === 'SWIFT_GROUP' || typeSelected === 'S3_GROUP') {
      this.showCredentialsSelect();
      const selectedCredentialsName = (<HTMLSelectElement>document.querySelector('#ingestor-element-credentials-type'))?.value;
      baseDatastore['credentials'] = selectedCredentialsName ?? "";
      baseDatastore['prefixLocation'] = "test";
      baseDatastore['containerPattern'] = {type: "mapperPattern", patternMapper: "S1.*:CDH-Sentinel-1"};
      baseDatastore['filter'] = ".*";
      delete baseDatastore['path'];
      delete baseDatastore['depth'];
      delete baseDatastore['granularity'];
    } else if (typeSelected === 'S3') {
      this.showCredentialsSelect();
      const selectedCredentialsName = (<HTMLSelectElement>document.querySelector('#ingestor-element-credentials-type'))?.value;
      baseDatastore['credentials'] = selectedCredentialsName ?? "";
      baseDatastore['prefixLocation'] = "";
      baseDatastore['bucket'] = "bucket-name";
      delete baseDatastore['path'];
      delete baseDatastore['depth'];
      delete baseDatastore['granularity'];
      delete baseDatastore['parentGroup'];
    } else if (typeSelected === 'HFS') {
      this.hideCredentialsSelect();
    } else if (typeSelected === 'TIME_GROUP') {
      this.hideCredentialsSelect();
      baseDatastore['policy'] = "BASIC_STORE_PRIORITY_POLICY";
      baseDatastore['filter'] = ".*";
      baseDatastore['children'] = [{
        name: "children-name",
        parentGroup: "",
        type: "HFS",
        permission: [
          "READ",
          "WRITE",
          "DELETE"
        ],
        properties: {
          property: [
            {
              "name": "KEEP_PERIOD_SECONDS",
              "value": "86400"
            }
          ]
        },
        path: "/path/to/child-datastore",
        depth: 0,
        granularity: 0
      }];
      delete baseDatastore['path'];
      delete baseDatastore['depth'];
      delete baseDatastore['granularity'];
      delete baseDatastore['parentGroup'];
    }
    baseDatastore['type'] = typeSelected;
    this.datastoreTypePrec = typeSelected;
    this.tempEditor.setValue(JSON.stringify(baseDatastore, null, 2));
  }
  async deleteDatastore(datastore: Datastore) {
    console.log("Deleting datastore of type " + datastore.type + " with name: " + datastore.name);
    const ret = await this.alert.showConfirm("Deleting datastore " + datastore.name, "Are you sure?");
    if (ret) {
      this.authenticationService.deleteDatastore(datastore).subscribe({
        next: (res) => {
          this.refreshPage();
        },
        error: (error) => {
          console.error(error);
          console.error(error.status);
        }
      });
    } else {
      return;
    }
  }


  /* METADATASTORES */
  onMetadatastoreClientTypeChange(event: Event) {
    const clientTypeSelected = (<HTMLSelectElement>(event.target))!.value;
    let addElementJsonObj = JSON.parse(this.addElementJsonText);
    //console.log("clientTypeSelected: ", clientTypeSelected);

    addElementJsonObj['clientType'] = clientTypeSelected;
    this.metadatastoreClientTypePrec = clientTypeSelected;
    this.tempEditor.setValue(JSON.stringify(addElementJsonObj, null, 2));
  }
  async deleteMetadatastore(metadatastore: Metadatastore) {
    console.log("Deleting metadatastore with name: " + metadatastore.name);
    const ret = await this.alert.showConfirm("Deleting metadatastore " + metadatastore.name, "Are you sure?");
    if (ret) {
      this.authenticationService.deleteMetadatastore(metadatastore).subscribe({
        next: (res) => {
          this.refreshPage();
        },
        error: (error) => {
          console.error(error);
          console.error(error.status);
        }
      });
    } else {
      return;
    }
  }


  /* CREDENTIALS */
  onCredentialTypeChange(event: Event) {
    const credentialTypeSelected = (<HTMLSelectElement>(event.target))!.value;
    let addElementJsonObj = JSON.parse(this.addElementJsonText);
    //console.log("credentialTypeSelected: ", credentialTypeSelected);
    let baseCredential: Credential = CreateCredential(addElementJsonObj.name);
    //console.log("baseCredential:", JSON.stringify(baseCredential, null, 2));
    const baseKeys = Object.keys(baseCredential);
    baseKeys.forEach((key: string) => {
      if (key in baseCredential) {
        (baseCredential as any)[key] = addElementJsonObj[key];
      }
    });

    //console.log("baseCredential after type change:", JSON.stringify(baseCredential, null, 2));
    if (credentialTypeSelected === 'swift') {
      baseCredential['user'] = "user-name";
      baseCredential['password'] = "password";
      baseCredential['tenant'] = "tenant-name";
      baseCredential['domain'] = "";
      baseCredential['url'] = "http://";
      delete baseCredential['accessKey'];
      delete baseCredential['secretKey'];
      delete baseCredential['endpoint'];
    } else if (credentialTypeSelected === 's3') {
      baseCredential['accessKey'] = "access-key";
      baseCredential['secretKey'] = "secret-key";
      baseCredential['endpoint'] = "http://";
      delete baseCredential['tenant'];
      delete baseCredential['domain'];
      delete baseCredential['url'];
      delete baseCredential['user'];
      delete baseCredential['password'];
    }

    this.tempEditor.setValue(JSON.stringify(baseCredential, null, 2));
  }
  async deleteCredential(name: string) {
    const tempCredentialToDelete = this.credentialsList.find((cred) => cred.name === name);
    const tempCredentialType = tempCredentialToDelete!.hasOwnProperty('user') ? 'SWIFT' : 'S3';
    console.log("Deleting credential with name: " + name + " of type: " + tempCredentialType);
    const ret = await this.alert.showConfirm("Deleting credential " + name + " of type " + tempCredentialType, "Are you sure?");
    if (ret) {
      this.authenticationService.deleteCredential(name, tempCredentialType).subscribe({
        next: (res) => {
          this.refreshPage();
        },
        error: (error) => {
          console.error(error);
          console.error(error.status);
        }
      });
    } else {
      return;
    }
  }


  /* PRODUCERS */
  onProducerSourceTypeChange(event: Event) {
    const sourceTypeSelected = (<HTMLSelectElement>(event.target))!.value;
    const addElementJsonObj = JSON.parse(this.addElementJsonText);
    //console.log("sourceTypeSelected: ", sourceTypeSelected);
    let baseProducer: Producer = CreateProducer(addElementJsonObj.name, this.producerSourceTypeList.filter(sourceTypeEl => sourceTypeEl.label === sourceTypeSelected)[0].type);
    //console.log("baseProducer:", JSON.stringify(baseProducer, null, 2));
    const baseKeys = Object.keys(baseProducer);
    baseKeys.forEach((key: string) => {
      if (key in baseProducer && key !== 'source') {
        (baseProducer as any)[key] = addElementJsonObj[key];
      }
    });

    if (sourceTypeSelected === 'FOLDER') {
      this.hideCredentialsSelect();
      this.hideODataTypeSelect();
      this.hideODataAuthTypeSelect();
      baseProducer['source']['path'] = "";
    } else if (sourceTypeSelected === 'SWIFT') {
      this.showCredentialsSelect();
      this.hideODataTypeSelect();
      this.hideODataAuthTypeSelect();
      baseProducer['source']['containers'] = "";
      baseProducer['source']['infiniteLoop'] = false;
      baseProducer['source']['credentials'] = this.credentialsList ? this.credentialsList[0].name : "";
    } else if (sourceTypeSelected === 'S3') {
      this.showCredentialsSelect();
      this.hideODataTypeSelect();
      this.hideODataAuthTypeSelect();
      baseProducer['dataSource'] = "";
      baseProducer['source']['buckets'] = "";
      baseProducer['source']['infiniteLoop'] = false;
      baseProducer['source']['credentials'] = this.credentialsList ? this.credentialsList[0].name : "";
    } else if (sourceTypeSelected === 'STAC') {
      this.hideCredentialsSelect();
      this.hideODataTypeSelect();
      this.hideODataAuthTypeSelect();
      baseProducer['source']['serviceRootUrl'] = "";
      baseProducer['source']['top'] = 10;
      baseProducer['source']['pivotDate'] = "";
      baseProducer['source']['pivotDateValue'] = "";
      baseProducer['source']['filter'] = {
        param: [{}]
      };
      baseProducer['source']['assumedFormat'] = ".zip";
      baseProducer['source']['fetchQuicklook'] = false;
      baseProducer['source']['useDateFromDb'] = true;
    } else if (sourceTypeSelected === 'ODATA') {
      this.hideCredentialsSelect();
      this.showODataTypeSelect();
      this.showODataAuthTypeSelect();
      baseProducer['source']['filter'] = ".*";
      baseProducer['source']['lastPublicationDate'] = "";
      baseProducer['source']['serviceRootUrl'] = "";
      baseProducer['source']['top'] = 10;
      baseProducer['source']['type'] = this.ODataTypeList[0];
      baseProducer['source']['assumedFormat'] = ".zip";
      baseProducer['source']['fetchQuicklook'] = false;
      baseProducer['source']['fetchAttributes'] = false;
      baseProducer['source']['useDateFromDb'] = true;
      baseProducer['source']['auth'] = {
        type: this.ODataAuthTypeList[0],
        user: "",
        password: ""
      };
    }

    this.producerSourceTypePrec = sourceTypeSelected;
    this.tempEditor.setValue(JSON.stringify(baseProducer, null, 2));
  }
  onProducerRestartChange(event: Event) {
    const restartSelected = (<HTMLSelectElement>(event.target))!.value;
    this.onEditElementRestartIngester = restartSelected === 'true';
  }
  showProducer(name: string) {
    (<HTMLElement>document.querySelector(".tab[data-tab-target='#ingesters']")!).click();
    const producersSelect = (<HTMLSelectElement>document.querySelector("#select-producer-for-ingester-select")!);
    producersSelect.value = name;
    setTimeout(() => {
      producersSelect.dispatchEvent(new Event('change'));
    }, 0);
  }
  startProducer(name: string) {
    console.log("Starting Producer with name: " + name);
    this.authenticationService.manageIngester(name, "start").subscribe({
      next: (res) => {
        this.refreshPage();
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }
  stopProducer(name: string) {
    console.log("Stop Producer with name: " + name);
    this.authenticationService.manageIngester(name, "stop").subscribe({
      next: (res) => {
        this.refreshPage();
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }
  async deleteProducer(name: string) {
    console.log("Deleting producer with name: " + name);
    const ret = await this.alert.showConfirm("Deleting producer " + name, "Are you sure?");
    if (ret) {
      this.authenticationService.deleteProducer(name).subscribe({
        next: (res) => {
          this.refreshPage();
        },
        error: (error) => {
          console.error(error);
          console.error(error.status);
        }
      });
    } else {
      return;
    }
  }


  /* CONSUMERS */
  onConsumerSourceTypeChange(event: Event) {
    const sourceTypeSelected = (<HTMLSelectElement>(event.target))!.value;
    const addElementJsonObj = JSON.parse(this.addElementJsonText);
    //console.log("sourceTypeSelected: ", sourceTypeSelected);
    let baseConsumer: Consumer = this.ingesterElementInEditorAction === 'add'? CreateConsumer(addElementJsonObj.name, this.consumerSourceTypeList.filter(sourceTypeEl => sourceTypeEl.label === sourceTypeSelected)[0].type) : addElementJsonObj;
    //console.log("baseConsumer:", JSON.stringify(baseConsumer, null, 2));
    const baseKeys = Object.keys(baseConsumer);
    baseKeys.forEach((key: string) => {
      if (key in baseConsumer && key !== 'source') {
        (baseConsumer as any)[key] = addElementJsonObj[key];
      }
    });

    if (sourceTypeSelected === 'FOLDER') {
      this.hideCredentialsSelect();
      this.hideODataTypeSelect();
      this.hideODataAuthTypeSelect();
      baseConsumer['source']['path'] = "";
    } else if (sourceTypeSelected === 'SWIFT') {
      this.showCredentialsSelect();
      this.hideODataTypeSelect();
      this.hideODataAuthTypeSelect();
      baseConsumer['source']['containers'] = "";
      baseConsumer['source']['credentials'] = this.credentialsList ? this.credentialsList[0].name : "";
    } else if (sourceTypeSelected === 'S3') {
      this.showCredentialsSelect();
      this.hideODataTypeSelect();
      this.hideODataAuthTypeSelect();
      baseConsumer['source']['buckets'] = "";
      baseConsumer['source']['productDirectories'] = false;
      baseConsumer['source']['suffix'] = "";
      baseConsumer['source']['credentials'] = this.credentialsList ? this.credentialsList[0].name : "";
    } else if (sourceTypeSelected === 'STAC') {
      this.hideCredentialsSelect();
      this.hideODataTypeSelect();
      this.showODataAuthTypeSelect();
      baseConsumer['source']['serviceRootUrl'] = "";
      baseConsumer['source']['retriesOn429'] = 0;
      baseConsumer['source']['retryWaitOn429Ms'] = 100;
      baseConsumer['source']['auth'] = {
        type: this.ODataAuthTypeList[0],
        user: "",
        password: ""
      };
    } else if (sourceTypeSelected === 'ODATA') {
      this.hideCredentialsSelect();
      this.hideODataTypeSelect();
      this.showODataAuthTypeSelect();
      baseConsumer['source']['serviceRootUrl'] = "";
      baseConsumer['source']['retriesOn429'] = 0;
      baseConsumer['source']['retryWaitOn429Ms'] = 100;
      baseConsumer['source']['auth'] = {
        type: this.ODataAuthTypeList[0],
        user: "",
        password: ""
      };
    }

    this.consumerSourceTypePrec = sourceTypeSelected;
    this.tempEditor.setValue(JSON.stringify(baseConsumer, null, 2));
  }
  onConsumerErrorManagerTypeChange(event: Event) {
    const errorManagerTypeSelected = (<HTMLSelectElement>(event.target))!.value;
    const addElementJsonObj = JSON.parse(this.addElementJsonText);
    //console.log("errorManagerTypeSelected: ", errorManagerTypeSelected);
    let baseConsumer: Consumer = this.ingesterElementInEditorAction === 'add' ? CreateConsumer(addElementJsonObj.name, addElementJsonObj.errorManager.type) : addElementJsonObj;
    //console.log("baseConsumer:", JSON.stringify(baseConsumer, null, 2));
    const baseKeys = Object.keys(baseConsumer);
    baseKeys.forEach((key: string) => {
      if (key in baseConsumer && key !== 'source') {
        (baseConsumer as any)[key] = addElementJsonObj[key];
      }
    });
    baseConsumer.source = addElementJsonObj.source;
    baseConsumer.errorManager.type = errorManagerTypeSelected;
    if (errorManagerTypeSelected === 'folder') {
      baseConsumer['errorManager']['errorLocation'] = "";
      delete baseConsumer['errorManager']['container'];
      delete baseConsumer['errorManager']['credentials'];
      delete baseConsumer['errorManager']['bucket'];
      delete baseConsumer['errorManager']['kafkaUser'];
      delete baseConsumer['errorManager']['kafkaPassword'];
      delete baseConsumer['errorManager']['kafkaTopic'];
      delete baseConsumer['errorManager']['kafkaHosts'];
    } else if (errorManagerTypeSelected === 'swift') {
      baseConsumer['errorManager']['container'] = "";
      baseConsumer['errorManager']['credentials'] = "";
      delete baseConsumer['errorManager']['errorLocation'];
      delete baseConsumer['errorManager']['bucket'];
      delete baseConsumer['errorManager']['kafkaUser'];
      delete baseConsumer['errorManager']['kafkaPassword'];
      delete baseConsumer['errorManager']['kafkaTopic'];
      delete baseConsumer['errorManager']['kafkaHosts'];
    } else if (errorManagerTypeSelected === 's3') {
      baseConsumer['errorManager']['bucket'] = "";
      baseConsumer['errorManager']['credentials'] = "";
      delete baseConsumer['errorManager']['errorLocation'];
      delete baseConsumer['errorManager']['container'];
      delete baseConsumer['errorManager']['kafkaUser'];
      delete baseConsumer['errorManager']['kafkaPassword'];
      delete baseConsumer['errorManager']['kafkaTopic'];
      delete baseConsumer['errorManager']['kafkaHosts'];
    } else if (errorManagerTypeSelected === 'kafka') {
      baseConsumer['errorManager']['kafkaUser'] = "";
      baseConsumer['errorManager']['kafkaPassword'] = "";
      baseConsumer['errorManager']['kafkaTopic'] = "";
      baseConsumer['errorManager']['kafkaHosts'] = "";
      delete baseConsumer['errorManager']['errorLocation'];
      delete baseConsumer['errorManager']['container'];
      delete baseConsumer['errorManager']['bucket'];
      delete baseConsumer['errorManager']['credentials'];
    }
    this.consumerErrorManagerTypePrec = errorManagerTypeSelected;
    this.tempEditor.setValue(JSON.stringify(baseConsumer, null, 2));
  }
  startConsumer(name: string) {
    console.log("Starting Consumer with name: " + name);
    this.authenticationService.manageIngester(name, "start").subscribe({
      next: (res) => {
        this.refreshPage();
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }
  stopConsumer(name: string) {
    console.log("Stop Consumer with name: " + name);
    this.authenticationService.manageIngester(name, "stop").subscribe({
      next: (res) => {
        this.refreshPage();
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }
  async deleteConsumer(name: string) {
    console.log("Deleting consumer with name: " + name);
    const ret = await this.alert.showConfirm("Deleting consumer " + name, "Are you sure?");
    if (ret) {
      this.authenticationService.deleteConsumer(name).subscribe({
        next: (res) => {
          this.refreshPage();
        },
        error: (error) => {
          console.error(error);
          console.error(error.status);
        }
      });
    } else {
      return;
    }
  }



  /* AUX Functions */
  cleanupMonacoInstancesAndContainers() {
    if (this.tempEditor) {
      this.tempEditor.dispose();
      this.tempEditor = undefined;
    }
    this.monaco.editor.getModels().forEach((model: any) => model.dispose());
    let oldIngesterItemsDivArray = document.querySelectorAll('#selected-ingester-parent-container div, #ingester-element-editor-container div, #ingester-element-editor-container div');
    [].forEach.call(oldIngesterItemsDivArray, (item: HTMLElement) => {
      item.remove();
    })
  }

  getTopicsArrayFromString(topics: string | null): string[] {
    return topics ? topics.split(/[;, ]+/) : [];
  }

  /* getJSONKeyRange(model: this.monaco.editor.ITextModel, key: string) {
    const text = model.getValue();

    const start = text.indexOf(`"${key}"`);
    if (start === -1) return null;

    // find first '{'
    let i = text.indexOf('{', start);

    let depth = 1;
    i++;

    // find closing '}'
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      i++;
    }

    return {
      startLine: model.getPositionAt(start).lineNumber,
      endLine: model.getPositionAt(i).lineNumber
    };
  } */

  prettifyJson(json: any): string {
    if (json === null || json === undefined) return "";
    return JSON.stringify(json, null, 2)
      .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>');
  }

  getTimestamp() {
    return new Date()
      .toISOString()
      .substring(0, 19)
      .replace(/:/g, "-");
  }

  onClosePressed() {
    this.cleanupMonacoInstancesAndContainers();
    let modals = document.querySelectorAll('.modal');
    [].forEach.call(modals, (modal: HTMLElement) => {
      modal.classList.add('hidden');
    })
  }

  refreshPage() {
    this.getIngesters();
  }

}
