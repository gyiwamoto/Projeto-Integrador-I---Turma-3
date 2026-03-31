import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

interface Paciente {
  data: string;
  id: number;
  nome: string;
  sobrenome: string;
  whatsapp: string;
  email: string;
  avisoEnviado: boolean;
}

@Component({
  selector: 'app-agenda-doutora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda-doutora.component.html',
  styleUrl: './agenda-doutora.component.scss',
})
export class AgendaDouToraComponent implements OnInit {
  doutora     = 'beatriz';
  termoBusca  = '';

  // Dados virão da API — começa vazio
  pacientes: Paciente[] = [];

  get nomeDoutora() {
    return this.doutora === 'beatriz' ? 'DRA BEATRIZ' : 'DRA LUCIANA';
  }

  get pacientesFiltrados(): Paciente[] {
    if (!this.termoBusca.trim()) return this.pacientes;
    const t = this.termoBusca.toLowerCase();
    return this.pacientes.filter(p =>
      p.nome.toLowerCase().includes(t)      ||
      p.sobrenome.toLowerCase().includes(t) ||
      p.whatsapp.includes(t)                ||
      p.email.toLowerCase().includes(t)     ||
      String(p.id).includes(t)
    );
  }

  get linhasVazias(): number[] {
    const min = 10;
    const restante = min - this.pacientesFiltrados.length;
    return restante > 0 ? Array(restante).fill(0) : [];
  }

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.doutora = this.route.snapshot.queryParamMap.get('doutora') ?? 'beatriz';
  }

  voltar() { this.router.navigate(['/home']); }
}
