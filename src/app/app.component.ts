import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './componentes/spinner/spinner.component';
import { NavBarComponent } from "./componentes/nav-bar/nav-bar.component";
import {
  trigger, transition, style, animate, query, group
} from '@angular/animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('routeAnimations', [
    // De abajo hacia arriba (solo para ciertos nombres)
    transition('home => mis-turnos, home => solicitar-turno, home => mi-perfil', [
      query(':enter, :leave', [
        style({ position: 'absolute', width: '100%' })
      ], { optional: true }),

      query(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 })
      ], { optional: true }),

      group([
        query(':leave', [
          animate('300ms ease-out', style({ opacity: 0 }))
        ], { optional: true }),

        query(':enter', [
          animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
        ], { optional: true })
      ])
    ]),

    // Default: Izquierda a derecha
    transition('* <=> *', [
      query(':enter, :leave', [
        style({ position: 'absolute', width: '100%' })
      ], { optional: true }),
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 })
      ], { optional: true }),
      group([
        query(':leave', [
          animate('200ms ease-out', style({ opacity: 0 }))
        ], { optional: true }),
        query(':enter', [
          animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
        ], { optional: true })
        ])
      ])
    ])
  ]
})

export class AppComponent {
  title = 'clinicaonline';
  cargando = true;
  getRouteAnimation(outlet: RouterOutlet) {
  return outlet?.activatedRouteData?.['animation'] ?? '';
}

}
