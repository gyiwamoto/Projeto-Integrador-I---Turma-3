import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-cadastro-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastro-paciente.component.html',
  styleUrl: './cadastro-paciente.component.scss',
})
export class CadastroPacienteComponent implements OnInit {
  form: FormGroup;
  loading    = signal(false);
  errorMsg   = signal('');
  successMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      cpf:       ['', Validators.required],
      nome:      ['', Validators.required],
      sobrenome: [''],
      celular:   [''],
      email:     ['', Validators.email],
      plano:     ['', Validators.required],
    });
  }

  get cpf()   { return this.form.get('cpf')!; }
  get nome()  { return this.form.get('nome')!; }
  get email() { return this.form.get('email')!; }
  get plano() { return this.form.get('plano')!; }

  ngOnInit() {
    // Preenche CPF se vier da tela de agendamento
    const cpf = this.route.snapshot.queryParamMap.get('cpf');
    if (cpf) this.form.patchValue({ cpf });
  }

  async onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    // ── Substituir por chamada real à API ─────────────────────────────────
    await new Promise(r => setTimeout(r, 900));
    console.log('Paciente a cadastrar:', this.form.value);
    this.successMsg.set('Paciente cadastrado com sucesso!');
    setTimeout(() => this.router.navigate(['/agendamento']), 1500);
    // ─────────────────────────────────────────────────────────────────────

    this.loading.set(false);
  }

  cancelar() {
    this.router.navigate(['/agendamento']);
  }
}
