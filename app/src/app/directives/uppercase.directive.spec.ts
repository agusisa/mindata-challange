import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UppercaseDirective } from './uppercase.directive';

@Component({
  template: `<input
    type="text"
    appUppercase
    [value]="inputValue"
    (input)="onInput($event)"
  />`,
  standalone: true,
  imports: [UppercaseDirective],
})
class TestComponent {
  inputValue = '';

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.inputValue = target.value;
  }
}

describe('UppercaseDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let inputElement: HTMLInputElement;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, UppercaseDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement.query(By.directive(UppercaseDirective));
    inputElement = debugElement.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(debugElement).toBeTruthy();
  });

  it('should convert input text to uppercase', () => {
    const testValue = 'hello world';

    inputElement.value = testValue;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));

    expect(inputElement.value).toBe('HELLO WORLD');
  });

  it('should handle empty input', () => {
    inputElement.value = '';
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));

    expect(inputElement.value).toBe('');
  });

  it('should handle special characters', () => {
    const testValue = 'hello-world_123!@#';

    inputElement.value = testValue;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));

    expect(inputElement.value).toBe('HELLO-WORLD_123!@#');
  });

  it('should handle already uppercase text', () => {
    const testValue = 'ALREADY UPPERCASE';

    inputElement.value = testValue;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));

    expect(inputElement.value).toBe('ALREADY UPPERCASE');
  });

  it('should handle mixed case text', () => {
    const testValue = 'MiXeD cAsE tExT';

    inputElement.value = testValue;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));

    expect(inputElement.value).toBe('MIXED CASE TEXT');
  });
});
