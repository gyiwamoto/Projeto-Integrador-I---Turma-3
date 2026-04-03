import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'sucesso' | 'erro' | 'info';

export interface ToastMensagem {
  id: number;
  tipo: ToastTipo;
  texto: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly listaToast = signal<ToastMensagem[]>([]);
  private ultimoId = 0;

  readonly toasts = this.listaToast.asReadonly();

  sucesso(texto: string): void {
    this.adicionar('sucesso', texto);
  }

  erro(texto: string): void {
    this.adicionar('erro', texto);
  }

  info(texto: string): void {
    this.adicionar('info', texto);
  }

  remover(id: number): void {
    this.listaToast.update((listaAtual) => listaAtual.filter((toast) => toast.id !== id));
  }

  private adicionar(tipo: ToastTipo, texto: string): void {
    const id = ++this.ultimoId;
    this.listaToast.update((listaAtual) => [...listaAtual, { id, tipo, texto }]);

    setTimeout(() => this.remover(id), 3500);
  }
}
