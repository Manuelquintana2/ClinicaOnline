import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { NgModel } from '@angular/forms';

@Directive({
  selector: '[appValidacionInput]'
})
export class ValidacionInputDirective {

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private ngModel: NgModel
  ) {}

  @HostListener('ngModelChange') onChange() {
    this.updateValidationClass();
  }

  @HostListener('blur') onBlur() {
    this.updateValidationClass();
  }

  private updateValidationClass() {
    const control = this.ngModel;
    const inputElement = this.el.nativeElement;

    if (control.invalid && (control.dirty || control.touched)) {
      this.renderer.addClass(inputElement, 'is-invalid');
      this.renderer.removeClass(inputElement, 'is-valid');
    } else if (control.valid && (control.dirty || control.touched)) {
      this.renderer.removeClass(inputElement, 'is-invalid');
      this.renderer.addClass(inputElement, 'is-valid');
    } else {
      this.renderer.removeClass(inputElement, 'is-valid');
      this.renderer.removeClass(inputElement, 'is-invalid');
    }
  }

}
