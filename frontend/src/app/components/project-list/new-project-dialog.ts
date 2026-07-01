import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Api } from '../../services/api';

@Component({
  selector: 'app-new-project-dialog',
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
  templateUrl: './new-project-dialog.html',
  styleUrl: './new-project-dialog.scss'
})
export class NewProjectDialog {
  data = {
    name: '',
    description: '',
    department: '',
    criticality_level: 'MEDIUM'
  };

  constructor(
    public dialogRef: MatDialogRef<NewProjectDialog>,
    private api: Api
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.data.name && this.data.department) {
      this.api.createProject(this.data).subscribe({
        next: (res) => this.dialogRef.close(res),
        error: (err) => console.error(err)
      });
    }
  }
}
