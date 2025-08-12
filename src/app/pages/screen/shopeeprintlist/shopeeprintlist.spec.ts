import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Shopeeprintlist } from './shopeeprintlist';

describe('Shopeeprintlist', () => {
  let component: Shopeeprintlist;
  let fixture: ComponentFixture<Shopeeprintlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shopeeprintlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shopeeprintlist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
