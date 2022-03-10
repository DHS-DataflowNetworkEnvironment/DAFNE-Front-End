import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchiveInfoComponent } from './archive-info.component';

describe('ArchiveInfoComponent', () => {
  let component: ArchiveInfoComponent;
  let fixture: ComponentFixture<ArchiveInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArchiveInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchiveInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
