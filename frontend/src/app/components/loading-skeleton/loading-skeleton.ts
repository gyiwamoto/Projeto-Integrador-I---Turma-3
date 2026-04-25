import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.html',
  styleUrls: ['./loading-skeleton.scss'],
})
export class LoadingSkeleton {
  @Input() mensagemCarregando = 'Carregando...';

  @Input() qtdSecoes = 2;
  @Input() qtdCards = 6;

  gerarArray(tamanho: number): number[] {
    return Array.from({ length: tamanho });
  }
}
