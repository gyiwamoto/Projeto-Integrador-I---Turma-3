import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input() aberto = false;
  @Input() titulo = '';
  @Input() descricao = '';
  @Input() modoEdicao = false;
  @Input() mostrarBotaoEditar = true;
  @Input() mostrarBotaoFechar = true;

  @Output() fechar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.aberto) {
      this.fechar.emit();
    }
  }

  aoClicarFora(): void {
    this.fechar.emit();
  }
}
