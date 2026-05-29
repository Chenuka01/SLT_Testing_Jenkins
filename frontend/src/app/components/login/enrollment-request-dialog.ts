import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Api } from '../../services/api';

@Component({
  selector: 'app-enrollment-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './enrollment-request-dialog.html',
  styleUrl: './enrollment-request-dialog.scss'
})
export class EnrollmentRequestDialog {
  isSubmitting = false;
  errorMessage = '';

  request = {
    slt_employee_id: '',
    full_name: '',
    email: '',
    department: '',
    requested_role: 'DEVELOPER',
    reason_for_access: ''
  };

  constructor(
    private api: Api,
    private dialogRef: MatDialogRef<EnrollmentRequestDialog>
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.isSubmitting = true;

    this.api.createEnrollmentRequest(this.request).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.isSubmitting = false;
        const errors = err?.error;
        if (errors && typeof errors === 'object') {
          this.errorMessage = Object.values(errors).flat().join(' ');
        } else {
          this.errorMessage = 'Enrollment request failed. Please retry or contact SecOps.';
        }
      }
    });
  }
}
