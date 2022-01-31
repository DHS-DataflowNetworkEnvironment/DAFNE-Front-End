import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSourceInfoComponent } from './data-source-info.component';

describe('DataSourceInfoComponent', () => {
  let component: DataSourceInfoComponent;
  let fixture: ComponentFixture<DataSourceInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataSourceInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataSourceInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
