import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Api } from '../../services/api';

@Component({
  selector: 'app-new-secret-dialog',
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
  templateUrl: './new-secret-dialog.html',
  styleUrl: './new-secret-dialog.scss'
})
export class NewSecretDialog implements OnInit {
  data = {
    service_name: '',
    target_url_or_ip: '',
    credential_type: 'API_KEY',
    username: '',
    secret: '',
    project_id: null
  };
  projects: any[] = [];
  hideSecret = true;

  constructor(
    public dialogRef: MatDialogRef<NewSecretDialog>,
    private api: Api
  ) {}

  ngOnInit() {
    this.api.getProjects().subscribe(res => this.projects = res);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.data.service_name && this.data.secret) {
      this.api.createCredential(this.data).subscribe({
        next: (res) => this.dialogRef.close(res),
        error: (err) => console.error(err)
      });
    }
  }
}
