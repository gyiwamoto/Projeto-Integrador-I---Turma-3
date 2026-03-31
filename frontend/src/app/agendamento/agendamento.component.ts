import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agendamento.component.html',
  styleUrl: './agendamento.component.scss',
})
export class AgendamentoComponent implements OnInit {
  form: FormGroup;
  loading  = signal(false);
  errorMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      cpf:    ['', Validators.required],
      nome:   [''],
      celular:[''],
    });
  }

  get cpf() { return this.form.get('cpf')!; }

  ngOnInit() {
    // Preenche CPF se vier da tela de agenda
    const cpf = this.route.snapshot.queryParamMap.get('cpf');
    if (cpf) this.form.patchValue({ cpf });
  }

  // Máscara de CPF: 000.000.000-00
  onCpfInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    input.value = v;
    this.form.get('cpf')!.setValue(v, { emitEvent: false });
  }

  async onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMsg.set('');

    // ── Substituir por chamada real à API ─────────────────────────────────
    await new Promise(r => setTimeout(r, 800));
    const cpfExistente = false;

    if (!cpfExistente) {
      this.router.navigate(['/cadastro-paciente'], {
        queryParams: { cpf: this.form.value.cpf }
      });
    }
    // ─────────────────────────────────────────────────────────────────────

    this.loading.set(false);
  }

  cancelar() {
    this.router.navigate(['/agenda']);
  }
}
