import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Topnavilayout } from './topnavilayout';

describe('Topnavilayout', () => {
  let component: Topnavilayout;
  let fixture: ComponentFixture<Topnavilayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topnavilayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Topnavilayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
