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
export class NewProjectDialog implements OnInit {
  isEdit = false;
  projectId: number | null = null;
  data = {
    name: '',
    description: '',
    department: '',
    criticality_level: 'MEDIUM'
  };

  constructor(
    public dialogRef: MatDialogRef<NewProjectDialog>,
    private api: Api,
    @Inject(MAT_DIALOG_DATA) public editData: any
  ) {}

  ngOnInit() {
    if (this.editData && this.editData.project) {
      this.isEdit = true;
      this.projectId = this.editData.project.id;
      this.data = {
        name: this.editData.project.name,
        description: this.editData.project.description || '',
        department: this.editData.project.department,
        criticality_level: this.editData.project.criticality_level || 'MEDIUM'
      };
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.data.name && this.data.department) {
      if (this.isEdit && this.projectId) {
        this.api.updateProject(this.projectId, this.data).subscribe({
          next: (res) => this.dialogRef.close(res),
          error: (err) => console.error(err)
        });
      } else {
        this.api.createProject(this.data).subscribe({
          next: (res) => this.dialogRef.close(res),
          error: (err) => console.error(err)
        });
      }
    }
  }
}
