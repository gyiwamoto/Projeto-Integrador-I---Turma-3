import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface TabelaLinha {
  [chave: string]: unknown;
}

export interface TabelaColuna {
  chave: string;
  titulo: string;
  formatador?: (valor: unknown, linha: TabelaLinha) => string;
}

@Component({
  selector: 'app-tabela',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabela.component.html',
  styleUrl: './tabela.component.scss',
})
export class TabelaComponent {
  @Input({ required: true }) colunas: TabelaColuna[] = [];
  @Input({ required: true }) linhas: TabelaLinha[] = [];
  @Input() carregando = false;
  @Input() mensagemCarregando = 'Carregando registros...';
  @Input() mensagemSemDados = 'Nenhum registro encontrado.';
  @Input() rotuloEditar = 'Editar';
  @Input() rotuloExcluir = 'Excluir';
  @Input() mostrarColunaEditar = true;
  @Input() mostrarColunaExcluir = true;
  @Input() acaoEditar: (linha: TabelaLinha) => void = () => undefined;
  @Input() acaoExcluir: (linha: TabelaLinha) => void = () => undefined;
  @Input() excluirDesabilitado: (linha: TabelaLinha) => boolean = () => false;

  modalDescricaoAberto = false;
  textoDescricaoModal = '';

  rastrearLinha(index: number, linha: TabelaLinha): string | number {
    const id = linha['id'];
    if (typeof id === 'string' || typeof id === 'number') {
      return id;
    }

    return index;
  }

  obterValorCelula(linha: TabelaLinha, coluna: TabelaColuna): string {
    const valor = linha[coluna.chave];

    if (coluna.formatador) {
      return coluna.formatador(valor, linha);
    }

    if (Array.isArray(valor)) {
      return valor.join(', ');
    }

    if (typeof valor === 'boolean') {
      return valor ? 'Sim' : 'Nao';
    }

    return valor == null ? '-' : String(valor);
  }

  editar(linha: TabelaLinha): void {
    this.acaoEditar(linha);
  }

  excluir(linha: TabelaLinha): void {
    if (this.excluirDesabilitado(linha)) {
      return;
    }

    this.acaoExcluir(linha);
  }

  possuiDescricao(linha: TabelaLinha, coluna: TabelaColuna): boolean {
    const valor = linha[coluna.chave];
    return typeof valor === 'string' && valor.trim().length > 0;
  }

  deveMostrarLerMais(linha: TabelaLinha, coluna: TabelaColuna): boolean {
    const valor = linha[coluna.chave];
    return typeof valor === 'string' && valor.trim().length > 20;
  }

  obterDescricaoCurta(linha: TabelaLinha, coluna: TabelaColuna): string {
    const valor = linha[coluna.chave];
    return typeof valor === 'string' && valor.trim() ? valor.trim() : '-';
  }

  abrirModalDescricao(linha: TabelaLinha, coluna: TabelaColuna): void {
    const valor = linha[coluna.chave];
    this.textoDescricaoModal =
      typeof valor === 'string' && valor.trim() ? valor : 'Descricao nao informada.';
    this.modalDescricaoAberto = true;
  }

  fecharModalDescricao(): void {
    this.modalDescricaoAberto = false;
    this.textoDescricaoModal = '';
  }

  get totalColunasRenderizadas(): number {
    return (
      this.colunas.length + (this.mostrarColunaEditar ? 1 : 0) + (this.mostrarColunaExcluir ? 1 : 0)
    );
  }
}
