import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationLatencyComponent } from './publication-latency.component';

describe('PublicationLatencyComponent', () => {
  let component: PublicationLatencyComponent;
  let fixture: ComponentFixture<PublicationLatencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PublicationLatencyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicationLatencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
