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

export interface AgendaDentista {
  id: string;
  nome: string;
}

export interface AgendaConsultaRenderItem {
  id: string;
  titulo: string;
  subtitulo?: string;
  posicao: number;
  corIndex?: number;
  isContinua?: boolean;
  isEditando?: boolean;
}

export interface AgendaSlotConsultaAcao {
  hora: number;
  min: number;
  consultaId: string;
}

@Component({
  selector: 'app-agenda-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda-calendario.component.html',
  styleUrl: './agenda-calendario.component.scss',
})
export class AgendaCalendarioComponent {
  @Input() carregando = false;
  @Input() consultasRenderToken: unknown = null;
  @Input() modoVisualizacao: ModoVisualizacaoAgenda = 'semana';
  @Input() mesAtual = '';
  @Input() anoAtual = 0;
  @Input() mesSelecionadoEhAtual = false;
  @Input() diasExibidos: DiaAgenda[] = [];
  @Input() diaSelecionado = 0;
  @Input() mesSelecionado = 0;
  @Input() dentistas: AgendaDentista[] = [];
  @Input() dentistaSelecionadoId = '';
  @Input() horas: number[] = [];
  @Input() minutos: number[] = [];
  @Input() nomeDiaSelecionado = '';
  @Input() consultaNoSlot: (hora: number, min: number) => string = () => '';
  @Input() consultasNoSlot: (hora: number, min: number) => AgendaConsultaRenderItem[] = () => [];

  @Output() modoVisualizacaoChange = new EventEmitter<ModoVisualizacaoAgenda>();
  @Output() periodoAnterior = new EventEmitter<void>();
  @Output() periodoProximo = new EventEmitter<void>();
  @Output() diaSelecionadoChange = new EventEmitter<{ dia: number; mes: number; ano: number }>();
  @Output() dentistaSelecionadoChange = new EventEmitter<string>();
  @Output() slotClick = new EventEmitter<AgendaSlot>();
  @Output() slotConsultaAcao = new EventEmitter<AgendaSlotConsultaAcao>();

  selecionarModoVisualizacao(modo: ModoVisualizacaoAgenda): void {
    if (this.carregando) {
      return;
    }

    this.modoVisualizacaoChange.emit(modo);
  }

  navegarAnterior(): void {
    if (this.carregando) {
      return;
    }

    this.periodoAnterior.emit();
  }

  navegarProximo(): void {
    if (this.carregando) {
      return;
    }

    this.periodoProximo.emit();
  }

  selecionarDia(dia: DiaAgenda): void {
    if (this.carregando || this.isDiaPassado(dia)) {
      return;
    }

    this.diaSelecionadoChange.emit({
      dia: dia.numero,
      mes: dia.mes,
      ano: dia.ano,
    });
  }

  selecionarDentista(dentistaId: string): void {
    if (this.carregando) {
      return;
    }

    this.dentistaSelecionadoChange.emit(dentistaId);
  }

  clicarSlot(hora: number, min: number): void {
    if (this.carregando) {
      return;
    }

    this.slotClick.emit({ hora, min });
  }

  obterConsulta(hora: number, min: number): string {
    return this.consultaNoSlot(hora, min);
  }

  obterConsultas(hora: number, min: number): AgendaConsultaRenderItem[] {
    return this.consultasNoSlot(hora, min);
  }

  acionarConsulta(event: Event, hora: number, min: number, consultaId: string): void {
    event.stopPropagation();

    if (this.carregando) {
      return;
    }

    this.slotConsultaAcao.emit({ hora, min, consultaId });
  }

  isDiaPassado(dia: DiaAgenda): boolean {
    const hoje = new Date();
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dataDia = new Date(dia.ano, dia.mes, dia.numero);

    return dataDia < hojeSemHora;
  }
}
