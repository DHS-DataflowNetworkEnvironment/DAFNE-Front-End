import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompletenessComponent } from './completeness.component';

describe('CompletenessComponent', () => {
  let component: CompletenessComponent;
  let fixture: ComponentFixture<CompletenessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompletenessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompletenessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
