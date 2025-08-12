import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from 'src/app/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-view',
  imports: [SidebarComponent, RouterOutlet],
  templateUrl: './main-view.component.html',
  styleUrl: './main-view.component.scss'
})
export class MainViewComponent implements OnInit{

  constructor() {}

  ngOnInit(): void {
    let headerContainer = document.querySelector('#header-container')!;
    headerContainer.classList.remove('disabled');
  }
}
