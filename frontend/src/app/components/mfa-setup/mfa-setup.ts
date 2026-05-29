import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../services/api';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mfa-setup',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatSnackBarModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './mfa-setup.html',
  styleUrl: './mfa-setup.scss',
})
export class MfaSetupComponent implements OnInit {
  qrCode: string = '';
  otpToken: string = '';
  qrLoaded: boolean = false;
  isVerified: boolean = false;

  constructor(private api: Api, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.setupMFA();
  }

  setupMFA(): void {
    this.api.setupMFA().subscribe(data => {
      // Ensure base64 prefix is present for the <img> tag
      if (data.qr_code && !data.qr_code.startsWith('data:image')) {
        this.qrCode = `data:image/png;base64,${data.qr_code}`;
      } else {
        this.qrCode = data.qr_code;
      }
      this.qrLoaded = true;
    });
  }

  verifyAndEnable(): void {
    if (!this.otpToken) return;
    this.api.verifyMFA(this.otpToken).subscribe({
      next: () => {
        this.isVerified = true;
        this.snackBar.open('MFA Enabled Successfully!', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Verification failed.', 'Close');
      }
    });
  }
}
