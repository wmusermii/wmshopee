import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stockopnamedetail } from './stockopnamedetail';

describe('Stockopnamedetail', () => {
  let component: Stockopnamedetail;
  let fixture: ComponentFixture<Stockopnamedetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stockopnamedetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Stockopnamedetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
