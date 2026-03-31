import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');
  showPassword = signal(false);

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      usuario: ['', [Validators.required]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get usuario() { return this.form.get('usuario')!; }
  get senha()   { return this.form.get('senha')!; }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    // ── Substituir pelo serviço de autenticação real ──────────────────────
    await new Promise(r => setTimeout(r, 900));
    const { usuario, senha } = this.form.value;
    if (usuario === 'admin' && senha === 'senha123') {
      this.router.navigate(['/home']);
    } else {
      this.errorMsg.set('Usuário ou senha incorretos.');
    }
    // ─────────────────────────────────────────────────────────────────────

    this.loading.set(false);
  }
}
