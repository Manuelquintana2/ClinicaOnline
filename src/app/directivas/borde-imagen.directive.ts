import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appBordeImagen]'
})
export class BordeImagenDirective {

  @Input('appBordeImagen') colorBorde: string = '#4193eb';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, 'border', `2px solid ${this.colorBorde}`);
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '50%');
    this.renderer.setStyle(this.el.nativeElement, 'object-fit', 'cover');
  }
}
