import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { EnrollmentRequestDialog } from './enrollment-request-dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  onLogin() {
    if ((this.username === 'SLT/EMP/001' && this.password === 'admin123') || 
        (this.username === 'SLT/EMP/432' && this.password === 'manager123') ||
        (this.username === 'admin' && this.password === 'admin')) {
      // For the demo, we store a mock session
      localStorage.setItem('user_id', this.username);
      this.router.navigate(['/projects']);
    } else {
      alert('Invalid Corporate ID or Vault Key');
    }
  }

  onRegisterRequest() {
    const dialogRef = this.dialog.open(EnrollmentRequestDialog, {
      panelClass: 'cyber-dialog-panel',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Enrollment request submitted to SecOps for approval.', 'OK', {
          duration: 5000
        });
      }
    });
  }
}
