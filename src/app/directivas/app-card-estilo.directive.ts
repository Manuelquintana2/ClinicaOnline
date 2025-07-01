import { Directive, ElementRef, Renderer2, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appCardEstilo]'
})
export class CardEstiloDirective implements OnInit {

   constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    // Ejemplo: aplica estilo a todas las cards automáticamente
    this.renderer.setStyle(this.el.nativeElement, 'border', '2px solid #4193eb');
    this.renderer.setStyle(this.el.nativeElement, 'padding', '1rem');
    this.renderer.setStyle(this.el.nativeElement, 'borderRadius', '8px');
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', '#1a1a1a'); // fondo oscuro, por ejemplo
  }
}
