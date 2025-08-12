import { Component, OnInit } from '@angular/core';
import { ConfigService } from 'src/app/services/config.service';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  public centreLogoPath: string = "";
  public softwareVersion: string = "";
  
  constructor(
    public authenticationService: AuthenticationService,
    public configService: ConfigService
  ) { }

  ngOnInit(): any {
    this.centreLogoPath = this.configService.getConfig().centreBackupLogoPath;
    this.softwareVersion = this.configService.getConfig().version;
    if (this.configService.getConfig().centreLogoPath != "") {
      this.centreLogoPath = this.configService.getConfig().centreLogoPath;
    }
  }
}
