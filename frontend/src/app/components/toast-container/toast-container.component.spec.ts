import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../services/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [ToastService],
    }).compileComponents();

    const fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('renderiza o componente', () => {
    expect(component).toBeDefined();
  });

  it('injeta ToastService corretamente', () => {
    expect(component['toastService']).toBe(toastService);
  });

  it('serviço possui método sucesso', () => {
    expect(typeof toastService.sucesso).toBe('function');
  });

  it('serviço possui método erro', () => {
    expect(typeof toastService.erro).toBe('function');
  });

  it('serviço possui método info', () => {
    expect(typeof toastService.info).toBe('function');
  });

  it('serviço possui método remover', () => {
    expect(typeof toastService.remover).toBe('function');
  });

  it('exibe toast de sucesso', () => {
    toastService.sucesso('Teste');
    expect(toastService.toasts().length).toBeGreaterThan(0);
  });

  it('exibe toast de erro', () => {
    toastService.erro('Erro');
    expect(toastService.toasts().length).toBeGreaterThan(0);
  });

  it('exibe toast de info', () => {
    toastService.info('Info');
    expect(toastService.toasts().length).toBeGreaterThan(0);
  });

  it('renderiza múltiplos toasts', () => {
    toastService.sucesso('Toast 1');
    toastService.erro('Toast 2');
    toastService.info('Toast 3');
    expect(toastService.toasts().length).toBe(3);
  });

  it('remove toast por id', () => {
    toastService.sucesso('Toast');
    const id = toastService.toasts()[0]?.id;
    if (id) {
      toastService.remover(id);
      expect(toastService.toasts().length).toBe(0);
    }
  });

  it('descreve toast com tipo sucesso', () => {
    toastService.sucesso('Mensagem');
    const toast = toastService.toasts()[0];
    expect(toast?.tipo).toBe('sucesso');
  });

  it('descreve toast com tipo erro', () => {
    toastService.erro('Erro');
    const toast = toastService.toasts()[0];
    expect(toast?.tipo).toBe('erro');
  });

  it('descreve toast com tipo info', () => {
    toastService.info('Info');
    const toast = toastService.toasts()[0];
    expect(toast?.tipo).toBe('info');
  });
});
