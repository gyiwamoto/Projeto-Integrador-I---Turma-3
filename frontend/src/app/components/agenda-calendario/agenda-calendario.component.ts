import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ModoVisualizacaoAgenda = 'semana' | 'mes';

export interface DiaAgenda {
  nome: string;
  numero: number;
  mes: number;
  ano: number;
  hoje: boolean;
}

export interface AgendaSlot {
  hora: number;
  min: number;
}

@Component({
  selector: 'app-agenda-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda-calendario.component.html',
  styleUrl: './agenda-calendario.component.scss',
})
export class AgendaCalendarioComponent {
  @Input() modoVisualizacao: ModoVisualizacaoAgenda = 'semana';
  @Input() mesAtual = '';
  @Input() anoAtual = 0;
  @Input() mesSelecionadoEhAtual = false;
  @Input() diasExibidos: DiaAgenda[] = [];
  @Input() diaSelecionado = 0;
  @Input() mesSelecionado = 0;
  @Input() doutoraSelecionada: 'beatriz' | 'luciana' = 'beatriz';
  @Input() horas: number[] = [];
  @Input() minutos: number[] = [];
  @Input() nomeDiaSelecionado = '';
  @Input() consultaNoSlot: (hora: number, min: number) => string = () => '';

  @Output() modoVisualizacaoChange = new EventEmitter<ModoVisualizacaoAgenda>();
  @Output() periodoAnterior = new EventEmitter<void>();
  @Output() periodoProximo = new EventEmitter<void>();
  @Output() diaSelecionadoChange = new EventEmitter<{ dia: number; mes: number; ano: number }>();
  @Output() doutoraSelecionadaChange = new EventEmitter<'beatriz' | 'luciana'>();
  @Output() slotClick = new EventEmitter<AgendaSlot>();

  selecionarModoVisualizacao(modo: ModoVisualizacaoAgenda): void {
    this.modoVisualizacaoChange.emit(modo);
  }

  navegarAnterior(): void {
    this.periodoAnterior.emit();
  }

  navegarProximo(): void {
    this.periodoProximo.emit();
  }

  selecionarDia(dia: DiaAgenda): void {
    if (this.isDiaPassado(dia)) {
      return;
    }

    this.diaSelecionadoChange.emit({
      dia: dia.numero,
      mes: dia.mes,
      ano: dia.ano,
    });
  }

  selecionarDoutora(doutora: 'beatriz' | 'luciana'): void {
    this.doutoraSelecionadaChange.emit(doutora);
  }

  clicarSlot(hora: number, min: number): void {
    this.slotClick.emit({ hora, min });
  }

  obterConsulta(hora: number, min: number): string {
    return this.consultaNoSlot(hora, min);
  }

  isDiaPassado(dia: DiaAgenda): boolean {
    const hoje = new Date();
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dataDia = new Date(dia.ano, dia.mes, dia.numero);

    return dataDia < hojeSemHora;
  }
}
