import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Slot { hora: number; min: number; }
interface Paciente { id: number; nome: string; sobrenome: string; cpf: string; whatsapp: string; }

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
})
export class AgendaComponent {
  horas   = [7,8,9,10,11,12,13,14,15,16,17];
  minutos = [0,15,30,45];

  doutoraSelecionada = 'beatriz';
  diaSelecionado     = new Date().getDate();
  mesSelecionado     = new Date().getMonth();
  anoSelecionado     = new Date().getFullYear();
  semanaOffset       = 0;

  // Modals
  popupAberto        = false;  // popup inicial: agendar ou cadastrar
  modalBuscaAberto   = false;  // busca de paciente
  modalConfirmAberto = false;  // confirmação final
  slotSelecionado: Slot | null = null;

  // Busca de paciente
  termoBusca     = '';
  pacienteSelecionado: Paciente | null = null;

  meses     = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
               'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  diasNomes = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'];

  // Mock pacientes — substituir por API
  todosPacientes: Paciente[] = [
    { id: 11,  nome: 'JOÃO',      sobrenome: 'SILVA',     cpf: '',             whatsapp: '11999990001' },
    { id: 12,  nome: 'ANTONIO',   sobrenome: 'SOUSA',     cpf: '',             whatsapp: '11999990003' },
    { id: 14,  nome: 'MARCELA',   sobrenome: 'ANDRADE',   cpf: '',             whatsapp: '11999990002' },
    { id: 18,  nome: 'GERSON',    sobrenome: 'IWAMOTO',   cpf: '12345678900',  whatsapp: '11994849006' },
    { id: 89,  nome: 'MILENA',    sobrenome: 'SOUSA',     cpf: '',             whatsapp: '11999990004' },
    { id: 110, nome: 'CARLOS',    sobrenome: 'RODRIGUES', cpf: '',             whatsapp: '' },
    { id: 111, nome: 'MARIA',     sobrenome: 'SANTOS',    cpf: '',             whatsapp: '11999990005' },
    { id: 135, nome: 'GABRIELLE', sobrenome: 'IWAMOTO',   cpf: '',             whatsapp: '11972689893' },
    { id: 151, nome: 'ANDREA',    sobrenome: 'ANDRADE',   cpf: '',             whatsapp: '11945889958' },
    { id: 222, nome: 'HELENA',    sobrenome: 'SOUSA',     cpf: '',             whatsapp: '' },
    { id: 331, nome: 'SANDRA',    sobrenome: 'GUTIERREZ', cpf: '',             whatsapp: '' },
  ];

  get pacientesFiltrados(): Paciente[] {
    if (!this.termoBusca.trim()) return this.todosPacientes;
    const t = this.termoBusca.toLowerCase();
    return this.todosPacientes.filter(p =>
      p.nome.toLowerCase().includes(t)      ||
      p.sobrenome.toLowerCase().includes(t) ||
      p.cpf.includes(t)                     ||
      p.whatsapp.includes(t)                ||
      String(p.id).includes(t)
    );
  }

  get diasSemana() {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    const diaSemana = hoje.getDay();
    const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    inicioSemana.setDate(hoje.getDate() + diffParaSegunda + this.semanaOffset * 7);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(inicioSemana);
      d.setDate(inicioSemana.getDate() + i);
      return { nome: this.diasNomes[d.getDay()], numero: d.getDate(), mes: d.getMonth(), ano: d.getFullYear() };
    });
  }

  get nomeDiaSelecionado() {
    return this.diasNomes[new Date(this.anoSelecionado, this.mesSelecionado, this.diaSelecionado).getDay()];
  }
  get mesAtual()  { return this.meses[this.mesSelecionado]; }
  get anoAtual()  { return this.anoSelecionado; }

  consultas: Record<string, Record<string, string>> = { beatriz: {}, luciana: {} };

  getConsulta(hora: number, min: number): string {
    return this.consultas[this.doutoraSelecionada]?.[`${hora}:${min}`] ?? '';
  }

  selecionarDia(dia: number, mes: number, ano: number) {
    this.diaSelecionado = dia; this.mesSelecionado = mes; this.anoSelecionado = ano;
  }
  selecionarDoutora(d: string) { this.doutoraSelecionada = d; }
  semanaAnterior() { this.semanaOffset--; }
  proximaSemana()  { this.semanaOffset++; }

  clicarSlot(hora: number, min: number) {
    if (this.getConsulta(hora, min)) return;
    this.slotSelecionado = { hora, min };
    this.popupAberto = true;
  }

  // Popup inicial
  escolherAgendar() {
    this.popupAberto = false;
    this.termoBusca = '';
    this.pacienteSelecionado = null;
    this.modalBuscaAberto = true;
  }

  escolherCadastrar() {
    this.popupAberto = false;
    this.router.navigate(['/cadastro-paciente']);
  }

  fecharPopup() { this.popupAberto = false; this.slotSelecionado = null; }

  // Busca paciente
  selecionarPaciente(p: Paciente) {
    this.pacienteSelecionado = p;
    this.modalBuscaAberto = false;
    this.modalConfirmAberto = true;
  }
  fecharBusca() { this.modalBuscaAberto = false; this.slotSelecionado = null; }

  // Confirmação
  confirmarAgendamento() {
    if (!this.slotSelecionado || !this.pacienteSelecionado) return;
    const key = `${this.slotSelecionado.hora}:${this.slotSelecionado.min}`;
    this.consultas[this.doutoraSelecionada][key] =
      `${this.pacienteSelecionado.id} ${this.pacienteSelecionado.nome}`;
    this.modalConfirmAberto = false;
    this.slotSelecionado = null;
    this.pacienteSelecionado = null;
  }
  fecharConfirm() { this.modalConfirmAberto = false; this.slotSelecionado = null; }

  voltar() { this.router.navigate(['/home']); }

  constructor(private router: Router) {}
}
