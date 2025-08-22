import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stockopname } from './stockopname';

describe('Stockopname', () => {
  let component: Stockopname;
  let fixture: ComponentFixture<Stockopname>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stockopname]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Stockopname);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
