import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Warehouselist } from './warehouselist';

describe('Warehouselist', () => {
  let component: Warehouselist;
  let fixture: ComponentFixture<Warehouselist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Warehouselist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Warehouselist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
