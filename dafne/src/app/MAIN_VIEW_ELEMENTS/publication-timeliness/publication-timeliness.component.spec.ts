import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicationTimelinessComponent } from './publication-timeliness.component';

describe('PublicationTimelinessComponent', () => {
  let component: PublicationTimelinessComponent;
  let fixture: ComponentFixture<PublicationTimelinessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationTimelinessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationTimelinessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
