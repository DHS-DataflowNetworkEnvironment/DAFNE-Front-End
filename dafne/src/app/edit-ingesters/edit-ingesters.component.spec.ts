import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditIngestersComponent } from './edit-ingesters.component';

describe('EditIngestersComponent', () => {
  let component: EditIngestersComponent;
  let fixture: ComponentFixture<EditIngestersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditIngestersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditIngestersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
