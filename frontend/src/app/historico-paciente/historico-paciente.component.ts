import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

interface Historico {
  idNome: string; data: string; dentista: string; procedimento: string;
  dente: string; face: string; tratamento1: string; tratamento2: string;
  tratamento3: string; tratamento4: string;
}

@Component({
  selector: 'app-historico-paciente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historico-paciente.component.html',
  styleUrl: './historico-paciente.component.scss',
})
export class HistoricoPacienteComponent implements OnInit {
  pacienteId   = '';
  pacienteNome = '';

  // Mock — substituir por API
  historico: Historico[] = [];

  // Mock para id 18 (Gerson) para demonstração
  mockHistorico: Record<string, Historico[]> = {
    '18': [
      { idNome: '18 GERSON', data: '24/02/2026', dentista: 'LUCIANA',  procedimento: 'IMPLANTE',     dente: '36', face: 'CERVICAL', tratamento1: '',          tratamento2: '',        tratamento3: '', tratamento4: '' },
      { idNome: '18 GERSON', data: '05/02/2026', dentista: 'LUCIANA',  procedimento: 'IMPLANTE',     dente: '34', face: 'CERVICAL', tratamento1: '',          tratamento2: '',        tratamento3: '', tratamento4: '' },
      { idNome: '18 GERSON', data: '11/10/2025', dentista: 'BEATRIZ',  procedimento: 'CANAL',        dente: '23', face: 'CERVICAL', tratamento1: 'CANAL',     tratamento2: '',        tratamento3: '', tratamento4: '' },
      { idNome: '18 GERSON', data: '03/10/2025', dentista: 'LUCIANA',  procedimento: 'RESTAURAÇÃO',  dente: '23', face: 'DISTAL',   tratamento1: 'RESTAURAÇÃO', tratamento2: 'PRÓTESE', tratamento3: '', tratamento4: '' },
      { idNome: '18 GERSON', data: '01/02/2025', dentista: 'LUCIANA',  procedimento: 'ORÇAMENTO',    dente: '',   face: '',         tratamento1: '',          tratamento2: '',        tratamento3: '', tratamento4: '' },
      { idNome: '18 GERSON', data: '01/02/2025', dentista: 'LUCIANA',  procedimento: 'ORÇAMENTO',    dente: '',   face: '',         tratamento1: '',          tratamento2: '',        tratamento3: '', tratamento4: '' },
    ]
  };

  get linhasVazias(): number[] {
    const min = 10;
    const restante = min - this.historico.length;
    return restante > 0 ? Array(restante).fill(0) : [];
  }

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.pacienteId   = this.route.snapshot.queryParamMap.get('id') ?? '';
    const nome        = this.route.snapshot.queryParamMap.get('nome') ?? '';
    const sobrenome   = this.route.snapshot.queryParamMap.get('sobrenome') ?? '';
    this.pacienteNome = `${nome} ${sobrenome}`.trim();

    // Carrega mock se existir, senão fica vazio (pronto para API)
    this.historico = this.mockHistorico[this.pacienteId] ?? [];
  }

  voltar() { this.router.navigate(['/pacientes']); }
}
