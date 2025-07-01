import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { GraficosService } from '../../servicios/graficos.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FechaFormateadaPipe } from '../../pipes/fecha-formateada.pipe';
import { ChangeDetectorRef } from '@angular/core';

Chart.register(...registerables);

@Component({
  standalone: true,
  selector: 'app-admin-estadisticas',
  imports: [CommonModule, FormsModule,FechaFormateadaPipe],
  templateUrl: './admin-estadisticas.component.html',
  styleUrls: ['./admin-estadisticas.component.css']
})
export class AdminEstadisticasComponent implements OnInit {

  // Datos
  logIngresos: any[] = [];
  turnosPorEspecialidad: any[] = [];
  turnosPorDia: any[] = [];
  turnosSolicitadosPorMedico: any[] = [];
  turnosFinalizadosPorMedico: any[] = [];

  desde: string = '';
  hasta: string = '';

  // Gráficos
  especialidadChart!: Chart;
  diaChart!: Chart;
  solicitadosMedicoChart!: Chart;
  finalizadosMedicoChart!: Chart;

  constructor(private graficosService: GraficosService,private cdr: ChangeDetectorRef ) {}

  async ngOnInit() {
    await this.cargarLogIngresos();
    await this.cargarTurnosPorEspecialidad();
    await this.cargarTurnosPorDia();
  }

  async cargarLogIngresos() {
    this.logIngresos = await this.graficosService.obtenerLogIngresos();
  }

  async cargarTurnosPorEspecialidad() {
    this.turnosPorEspecialidad = await this.graficosService.turnosPorEspecialidad();
    this.renderEspecialidadChart();
  }

  async cargarTurnosPorDia() {
    this.turnosPorDia = await this.graficosService.turnosPorDia();
    this.renderDiaChart();
  }

async filtrarPorFechas() {
  if (!this.desde || !this.hasta) return;

  this.turnosSolicitadosPorMedico = await this.graficosService.turnosSolicitadosPorMedico(this.desde, this.hasta);
  this.turnosFinalizadosPorMedico = await this.graficosService.turnosFinalizadosPorMedico(this.desde, this.hasta);

  // Forzamos a Angular a actualizar el DOM antes de renderizar el gráfico
  this.cdr.detectChanges();

  this.renderSolicitadosMedicoChart();
  this.renderFinalizadosMedicoChart();
}
  renderEspecialidadChart() {
    const ctx = document.getElementById('especialidadChart') as HTMLCanvasElement;
    if (this.especialidadChart) this.especialidadChart.destroy();

    this.especialidadChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.turnosPorEspecialidad.map(t => t.especialidad),
        datasets: [{
          label: 'Cantidad de Turnos',
          data: this.turnosPorEspecialidad.map(t => t.cantidad),
          backgroundColor: 'rgba(54, 162, 235, 0.7)'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  renderDiaChart() {
    const ctx = document.getElementById('diaChart') as HTMLCanvasElement;
    if (this.diaChart) this.diaChart.destroy();

    this.diaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.turnosPorDia.map(t => t.fecha),
        datasets: [{
          label: 'Turnos por Día',
          data: this.turnosPorDia.map(t => t.cantidad),
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  renderSolicitadosMedicoChart() {
    const ctx = document.getElementById('solicitadosMedicoChart') as HTMLCanvasElement;
    if (this.solicitadosMedicoChart) this.solicitadosMedicoChart.destroy();

    this.solicitadosMedicoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.turnosSolicitadosPorMedico.map(t => t.uid_especialista),
        datasets: [{
          label: 'Turnos Solicitados por Médico',
          data: this.turnosSolicitadosPorMedico.map(t => t.cantidad),
          backgroundColor: 'rgba(75, 192, 192, 0.7)'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  renderFinalizadosMedicoChart() {
    const ctx = document.getElementById('finalizadosMedicoChart') as HTMLCanvasElement;
    if (this.finalizadosMedicoChart) this.finalizadosMedicoChart.destroy();

    this.finalizadosMedicoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.turnosFinalizadosPorMedico.map(t => t.uid_especialista),
        datasets: [{
          label: 'Turnos finalizados por Médico',
          data: this.turnosFinalizadosPorMedico.map(t => t.cantidad),
          backgroundColor: 'rgba(173, 75, 192, 0.7)'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
  exportarExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.logIngresos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LogIngresos');
    XLSX.writeFile(workbook, 'log-ingresos.xlsx');
  }

  exportarPDF() {
    const doc = new jsPDF();
    doc.text('Log de Ingresos al Sistema', 10, 10);
    autoTable(doc, {
      startY: 20,
      head: [['Usuario', 'Fecha']],
      body: this.logIngresos.map(log => [log.email, log.fecha_ingreso])
    });
    doc.save('log-ingresos.pdf');
  }

  exportarEspecialidadExcel() {
  const ws = XLSX.utils.json_to_sheet(this.turnosPorEspecialidad);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Turnos por Especialidad');
  XLSX.writeFile(wb, 'turnos-por-especialidad.xlsx');
}

exportarEspecialidadPDF() {
  const doc = new jsPDF();
  doc.text('Turnos por Especialidad', 10, 10);
  autoTable(doc, {
    startY: 20,
    head: [['Especialidad', 'Cantidad']],
    body: this.turnosPorEspecialidad.map(t => [t.especialidad, t.cantidad])
  });
  doc.save('turnos-por-especialidad.pdf');
}

exportarDiaExcel() {
  const ws = XLSX.utils.json_to_sheet(this.turnosPorDia);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Turnos por Día');
  XLSX.writeFile(wb, 'turnos-por-dia.xlsx');
}

exportarDiaPDF() {
  const doc = new jsPDF();
  doc.text('Turnos por Día', 10, 10);
  autoTable(doc, {
    startY: 20,
    head: [['Fecha', 'Cantidad']],
    body: this.turnosPorDia.map(t => [t.fecha, t.cantidad])
  });
  doc.save('turnos-por-dia.pdf');
}

exportarSolicitadosExcel() {
  const ws = XLSX.utils.json_to_sheet(this.turnosSolicitadosPorMedico);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Turnos Solicitados');
  XLSX.writeFile(wb, 'turnos-solicitados.xlsx');
}

exportarSolicitadosPDF() {
  const doc = new jsPDF();
  doc.text('Turnos Solicitados por Médico', 10, 10);
  autoTable(doc, {
    startY: 20,
    head: [['Especialista', 'Cantidad']],
    body: this.turnosSolicitadosPorMedico.map(t => [t.uid_especialista, t.cantidad])
  });
  doc.save('turnos-solicitados.pdf');
}

exportarFinalizadosExcel() {
  const ws = XLSX.utils.json_to_sheet(this.turnosFinalizadosPorMedico);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Turnos Finalizados');
  XLSX.writeFile(wb, 'turnos-finalizados.xlsx');
}

exportarFinalizadosPDF() {
  const doc = new jsPDF();
  doc.text('Turnos Finalizados por Médico', 10, 10);
  autoTable(doc, {
    startY: 20,
    head: [['Especialista', 'Cantidad']],
    body: this.turnosFinalizadosPorMedico.map(t => [t.uid_especialista, t.cantidad])
  });
  doc.save('turnos-finalizados.pdf');
}

}
