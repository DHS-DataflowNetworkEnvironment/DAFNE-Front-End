import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MessageService } from 'src/app/services/message.service';
import { Deck, MapView} from '@deck.gl/core';
import { GeoJsonLayer, ArcLayer, TextLayer, IconLayer } from '@deck.gl/layers';
import { Centre } from 'src/app/models/models';
import { Functions } from 'src/app/util/functions';
import { ConfigService } from 'src/app/services/config.service';

@Component({
  selector: 'app-network-view',
  imports: [CommonModule],
  templateUrl: './network-view.component.html',
  styleUrl: './network-view.component.scss'
})
export class NetworkViewComponent implements OnInit {
  public mapTitle: string = 'Network View';
  private showArcs: boolean = false;

  private mapType: string = 'homeView';
  private mapTypePrec: string = 'homeView';
  public dataSource: any = {};
  private allCentreList: any;
  public remoteCentreList: any;
  public localCentre: Centre = {
    id: 0,
    name: '',
    local: false,
    color: '#555',
    latitude: '0.0',
    longitude: '0.0',
    icon: 'home',
    description: ''
  };
  private localId: number = -1;

  HOME_INITIAL_VIEW_STATE = {
    latitude: 48.0,
    longitude: 15.0,
    zoom: 3.5,
    bearing: 0,
    pitch: 0
  }
  ACTIVE_INITIAL_VIEW_STATE = {
    latitude: 48.0,
    longitude: 13.0,
    zoom: 4.0, // Values from 0 to 15
    bearing: 0, // POV rotation. Positive -> turn CW
    pitch: 55 // Degrees angles from 0 to 60, with 0 = Zenith
  }
  public INITIAL_VIEW_STATE = this.HOME_INITIAL_VIEW_STATE;

  private ICON_MAPPING: {[key:string]: string} = {
    home: 'assets/icons/home.svg',
    place: 'assets/icons/place.svg'
  };

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private functions: Functions,
    public configService: ConfigService
  ) {

  }

  ngOnInit(): any {
    this.getAllCentres();
    this.messageService.hideSidebar(false);
  }

  getAllCentres(): any {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        var resultForLocal = Object.values(res).filter((x) => x.local === true);
        if (resultForLocal[0] == undefined) {
          this.localId = -1;
        } else {
          this.localId = resultForLocal[0].id;
        }
        this.dataSource = resultForLocal;
        this.remoteCentreList = Object.values(res).filter((x) => x.local === null);
        this.remoteCentreList.sort(this.functions.getSortOrder("id"));
        this.allCentreList = res;
        this.allCentreList.sort(this.functions.getSortOrder("id"));
        this.checkLatLonPos(this.allCentreList);

        if (Object.values(res).filter((x) => x.local === true)[0]) {
          this.localCentre = Object.values(res).filter((x) => x.local === true)[0];
          this.messageService.setLocalPresent(true);
        } else {
          this.messageService.setLocalPresent(false);
          this.localCentre = {
            id: -1,
            name: '',
            color: '#555',
            latitude: '0.0',
            longitude: '0.0',
            local: false,
            icon: 'home',
            description: ''
          };
        }
        this.initDeck();
      }
    );
  }

  initDeck() {
    const bounds = [[-170, -80], [170, 80]];

    function applyViewStateConstraints(viewState: any) {
      return {
        ...viewState,
        longitude: Math.min(bounds[1][0], Math.max(bounds[0][0], viewState.longitude)),
        latitude: Math.min(bounds[1][1], Math.max(bounds[0][1], viewState.latitude))
      };
    }

    const geoJsonLayer = new GeoJsonLayer({
      id: 'GeoJsonLayer',
      //data: 'assets/world-maps/world-countries.geojson', // Highly detailed map
      data: 'assets/world-maps/ne_50m_admin_0_countries.geojson', // Medium-high detailed map
      //data: 'assets/world-maps/ne_110m_admin_0_countries.geojson', // Mediumly detailed map
      //data: 'assets/world-maps/ne_110m_land.geojson', // Lowly detailed map
      stroked: true,
      filled: true,
      pickable: true,
      getFillColor: [0, 0, 0], 
      getLineColor: [60, 60, 60],
      lineWidthUnits: 'pixels',
      getLineWidth: 1
    });

    const iconLayer = new IconLayer({
      id: 'icon-layer',
      data: this.allCentreList,
      pickable: true,
      billboard: true, // false = flat on terrain, true = vertical
      getIcon: (d:any) => {
        const tempKey: string = d.icon; 
        return {
          url: this.ICON_MAPPING[tempKey],
          width: 96,
          height: 64,
          anchorY: 48,
          mask: true
        }
      },
      parameters: {
        depthTest: false
      },
      getPosition: (d:any) => [d.longitude, d.latitude, 0],
      getSize: this.configService.getConfig().mapSettings.iconSize,
      getColor: (d:any) => this.rgbConvertToArray(d.color)
    });

    const textLayer = new TextLayer({
      id: 'text-layer',
      data: this.allCentreList,
      fontFamily: '"NotesESA-Reg", Arial, Helvetica, sans-serif',
      pickable: true,
      parameters: {
        depthTest: false
      },
      getPosition: (d:any) => [d.longitude, d.latitude],
      getText: (d:any) => d.name,
      getSize: this.configService.getConfig().mapSettings.textSize,
      sizeUnits: 'pixels',
      getPixelOffset: (d:any) => (d.textAnchor == 'end' ? [-20, -4] : [20, -4]),
      getAngle: 0,
      getColor: [255, 255, 255],
      getTextAnchor: (d:any) => d.textAnchor,
      getAlignmentBaseline: 'bottom'
    });

    const arcLayer = new ArcLayer({
      id: 'arcs-layer',
      data: this.dataSource,
      getSourcePosition: (d:any) => [<any>this.localCentre.longitude, <any>this.localCentre.latitude],
      getTargetPosition: (d:any) => [d.longitude, d.latitude],
      getSourceColor: this.mapType == 'dhsConnected' ? this.rgbConvertToArray(this.localCentre.color) : d => this.rgbConvertToArray(d.color),
      getTargetColor: this.mapType == 'dhsConnected' ? this.rgbConvertToArray(this.localCentre.color) : d => this.rgbConvertToArray(d.color),
      getWidth: 1
    });

    const deckInstance = new Deck({
      parent: <HTMLDivElement>document.getElementById('network-view-content'),
      initialViewState: this.INITIAL_VIEW_STATE,
      controller: true,
      views: new MapView({repeat: false}),
      //getTooltip: ({object}) => object && object.properties.name,
      layers: [geoJsonLayer, iconLayer, textLayer, arcLayer],
      onViewStateChange: ({viewState}) => applyViewStateConstraints(viewState)
    });
  }

  checkLatLonPos(list: Array<any>) {
    /* Check if two centres are close and change label anchor consequently */
    let latitudeWindowCheck: number = 0.5;
    let longitudeWindowCheck: number = 10.0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].hasOwnProperty('textAnchor') == false) {
        list[i]['textAnchor'] = 'end';
      } else {
      }
      for (var k = 0; k < i; k++) {
        if (
          Math.abs(list[i].latitude - list[k].latitude) < latitudeWindowCheck &&
          list[i].longitude - list[k].longitude < longitudeWindowCheck
        ) {
          list[i].textAnchor = 'start';
        }
      }
    }
  }

  /* Function to convert [r, g, b] colors to html string: "#rrggbb" */
  rgbConvertToString(col: [number, number, number]) {
    let color: string = "#" + col[0].toString(16).padStart(2, '0') + col[1].toString(16).padStart(2, '0') + col[2].toString(16).padStart(2, '0');
    return color;
  }

  /* Function to convert #rrggbb colors to array: [r, g, b] */
  rgbConvertToArray(col: string):[number, number, number] {
    if (col.length != 7) {
      return [100, 200, 250];
    }
    if (col.charAt(0) != '#') return [200, 0, 0];
    let r:number = parseInt(col.substr(1, 2), 16);
    let g:number = parseInt(col.substr(3, 2), 16);
    let b:number = parseInt(col.substr(5, 2), 16);
    let color:[number, number, number] = [r, g, b];
    return color;
  }
}
