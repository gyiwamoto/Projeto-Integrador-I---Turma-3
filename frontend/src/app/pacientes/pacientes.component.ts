import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface Paciente {
  id: number; nome: string; sobrenome: string; dataNasc: string;
  whatsapp: string; email: string; endereco: string;
  tipo: string; cpf: string; carteirinha: string;
}

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.scss',
})
export class PacientesComponent {
  termoBusca = '';

  pacientes: Paciente[] = [
    { id: 11,   nome: 'JOÃO',      sobrenome: 'SILVA',     dataNasc: '02/08/1965', whatsapp: '11999990001', email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 12,   nome: 'ANTONIO',   sobrenome: 'SOUSA',     dataNasc: '26/11/1951', whatsapp: '11999990003', email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 14,   nome: 'MARCELA',   sobrenome: 'ANDRADE',   dataNasc: '25/04/2005', whatsapp: '11999990002', email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 18,   nome: 'GERSON',    sobrenome: 'IWAMOTO',   dataNasc: '15/05/1969', whatsapp: '11994849006', email: 'gyiwamoto@gmail.com',         endereco: 'Rua Nelson Mazzel 2443', tipo: 'Particular', cpf: '12345678900', carteirinha: '' },
    { id: 89,   nome: 'MILENA',    sobrenome: 'SOUSA',     dataNasc: '06/06/2004', whatsapp: '11999990004', email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 110,  nome: 'CARLOS',    sobrenome: 'RODRIGUES', dataNasc: '',           whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 111,  nome: 'MARIA',     sobrenome: 'SANTOS',    dataNasc: '12/03/1988', whatsapp: '11999990005', email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 135,  nome: 'GABRIELLE', sobrenome: 'IWAMOTO',   dataNasc: '16/02/2004', whatsapp: '11972689893', email: 'gabrielle.iwamoto@gmail.com', endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 151,  nome: 'ANDREA',    sobrenome: 'ANDRADE',   dataNasc: '15/11/2003', whatsapp: '11945889958', email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 191,  nome: 'MARCELO',   sobrenome: 'IWAMOTO',   dataNasc: '11/03/2010', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 200,  nome: 'ITAMAR',    sobrenome: 'FRANCO',    dataNasc: '10/04/1966', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 222,  nome: 'HELENA',    sobrenome: 'SOUSA',     dataNasc: '11/03/2010', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 223,  nome: 'ISADORA',   sobrenome: 'SOUSA',     dataNasc: '11/03/2010', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 304,  nome: 'MARCOS',    sobrenome: 'COMOLATTI', dataNasc: '02/05/1958', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 331,  nome: 'SANDRA',    sobrenome: 'GUTIERREZ', dataNasc: '28/02/1974', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 998,  nome: 'MARCELO',   sobrenome: 'WATANABE',  dataNasc: '13/11/2008', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 1358, nome: 'JOANA',     sobrenome: 'FROZEN',    dataNasc: '05/09/2010', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
    { id: 2005, nome: 'ANA',       sobrenome: 'SANTOS',    dataNasc: '11/03/2011', whatsapp: '',            email: '',                           endereco: '',                       tipo: '',          cpf: '',             carteirinha: '' },
  ];

  get pacientesFiltrados(): Paciente[] {
    if (!this.termoBusca.trim()) return this.pacientes;
    const t = this.termoBusca.toLowerCase();
    return this.pacientes.filter(p =>
      p.nome.toLowerCase().includes(t)      ||
      p.sobrenome.toLowerCase().includes(t) ||
      p.cpf.includes(t)                     ||
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

  constructor(private router: Router) {}

  verHistorico(p: Paciente) {
    this.router.navigate(['/historico-paciente'], {
      queryParams: { id: p.id, nome: p.nome, sobrenome: p.sobrenome }
    });
  }

  voltar() { this.router.navigate(['/home']); }
}
