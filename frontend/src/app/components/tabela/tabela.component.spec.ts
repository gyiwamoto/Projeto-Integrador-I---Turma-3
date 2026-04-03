import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabelaComponent, TabelaColuna, TabelaLinha } from './tabela.component';

describe('TabelaComponent', () => {
  let fixture: ComponentFixture<TabelaComponent>;
  let component: TabelaComponent;

  const colunasTesteMock: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'idade', titulo: 'Idade' },
    { chave: 'ativo', titulo: 'Status' },
  ];

  const linhasTesteMock: TabelaLinha[] = [
    { id: 1, nome: 'João', idade: 30, ativo: true },
    { id: 2, nome: 'Maria', idade: 25, ativo: false },
  ];
  const linha1 = linhasTesteMock[0]!;
  const linha2 = linhasTesteMock[1]!;
  const colunaStatus = colunasTesteMock[2]!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabelaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TabelaComponent);
    component = fixture.componentInstance;
    component.colunas = colunasTesteMock;
    component.linhas = linhasTesteMock;
    fixture.detectChanges();
  });
  it('armazena colunas corretamente', () => {
    expect(component.colunas.length).toBe(3);
    expect(component.colunas[0]?.titulo).toBe('Nome');
  });

  it('armazena linhas corretamente', () => {
    expect(component.linhas.length).toBe(2);
    expect(component.linhas[0]?.['nome']).toBe('João');
  });

  it('exibe mensagem quando nao ha dados', () => {
    component.linhas = [];
    component.mensagemSemDados = 'Nenhum registro encontrado.';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    const mensagem = fixture.nativeElement.textContent;
    expect(mensagem).toContain('Nenhum registro encontrado.');
  });

  it('formata valores booleanos como Sim/Nao', () => {
    const valor = component.obterValorCelula(linha1, colunaStatus);
    expect(valor).toBe('Sim');

    const valor2 = component.obterValorCelula(linha2, colunaStatus);
    expect(valor2).toBe('Nao');
  });

  it('formata arrays como string separada por virgula', () => {
    const colunaArray: TabelaColuna = { chave: 'tags', titulo: 'Tags' };
    const linhaArray: TabelaLinha = { id: 1, tags: ['tag1', 'tag2', 'tag3'] };

    const valor = component.obterValorCelula(linhaArray, colunaArray);
    expect(valor).toBe('tag1, tag2, tag3');
  });

  it('usa formatador customizado quando definido', () => {
    const colunaFormatada: TabelaColuna = {
      chave: 'idade',
      titulo: 'Idade',
      formatador: (valor) => `${valor} anos`,
    };

    const valor = component.obterValorCelula(linha1, colunaFormatada);
    expect(valor).toBe('30 anos');
  });

  it('retorna traco quando valor eh null ou undefined', () => {
    const colunaSimples: TabelaColuna = { chave: 'nome', titulo: 'Nome' };
    const linhaVazia: TabelaLinha = { id: 1, nome: null };

    const valor = component.obterValorCelula(linhaVazia, colunaSimples);
    expect(valor).toBe('-');
  });

  it('usa ID como rastreador quando disponivel', () => {
    const rastreador = component.rastrearLinha(0, linha1);
    expect(rastreador).toBe(1);
  });

  it('usa index como rastreador quando ID nao esta disponivel', () => {
    const linhaAlterar: TabelaLinha = { nome: 'Pedro' };
    const rastreador = component.rastrearLinha(5, linhaAlterar);
    expect(rastreador).toBe(5);
  });

  it('chama acaoEditar quando editar eh acionado', () => {
    let chamado = false;
    component.acaoEditar = () => {
      chamado = true;
    };

    component.editar(linha1);

    expect(chamado).toBe(true);
  });

  it('chama acaoExcluir quando excluir eh acionado', () => {
    let chamado = false;
    component.acaoExcluir = () => {
      chamado = true;
    };
    component.excluirDesabilitado = () => false;

    component.excluir(linha1);

    expect(chamado).toBe(true);
  });

  it('nao chama acaoExcluir quando exclusao esta desabilitada', () => {
    let chamado = false;
    component.acaoExcluir = () => {
      chamado = true;
    };
    component.excluirDesabilitado = () => true;

    component.excluir(linha1);

    expect(chamado).toBe(false);
  });
});
