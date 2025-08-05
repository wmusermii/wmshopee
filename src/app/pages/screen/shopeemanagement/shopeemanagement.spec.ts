import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Shopeemanagement } from './shopeemanagement';

describe('Shopeemanagement', () => {
  let component: Shopeemanagement;
  let fixture: ComponentFixture<Shopeemanagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shopeemanagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shopeemanagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
