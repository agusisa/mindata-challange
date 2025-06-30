import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appUppercase]',
  standalone: true,
})
export class UppercaseDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      const currentValue = target.value;
      const uppercaseValue = currentValue.toUpperCase();

      if (currentValue !== uppercaseValue) {
        const cursorPosition = target.selectionStart;

        this.renderer.setProperty(target, 'value', uppercaseValue);

        if (cursorPosition !== null) {
          target.setSelectionRange(cursorPosition, cursorPosition);
        }

        const inputEvent = new Event('input', { bubbles: true });
        target.dispatchEvent(inputEvent);
      }
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text') || '';
    const uppercaseText = clipboardData.toUpperCase();

    const target = event.target as HTMLInputElement;
    if (target) {
      const cursorPosition = target.selectionStart || 0;
      const currentValue = target.value;
      const newValue =
        currentValue.slice(0, cursorPosition) +
        uppercaseText +
        currentValue.slice(target.selectionEnd || cursorPosition);

      this.renderer.setProperty(target, 'value', newValue);

      const newCursorPosition = cursorPosition + uppercaseText.length;
      target.setSelectionRange(newCursorPosition, newCursorPosition);

      const inputEvent = new Event('input', { bubbles: true });
      target.dispatchEvent(inputEvent);
    }
  }
}
