import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DhsConnectedComponent } from './dhs-connected.component';

describe('DhsConnectedComponent', () => {
  let component: DhsConnectedComponent;
  let fixture: ComponentFixture<DhsConnectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DhsConnectedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DhsConnectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
