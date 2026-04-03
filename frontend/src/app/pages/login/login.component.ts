import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() {
    return this.form.get('email')!;
  }

  get senha() {
    return this.form.get('senha')!;
  }

  togglePassword(): void {
    this.showPassword.update((valor) => !valor);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const { email, senha } = this.form.getRawValue();

    this.authService.login(email, senha).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/dashboard'], { replaceUrl: true });
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.errorMsg.set(error.message || 'Nao foi possivel entrar.');
      },
    });
  }
}
