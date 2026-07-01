import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Api } from '../../services/api';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NewProjectDialog } from './new-project-dialog';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    RouterLink, 
    FormsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss'
})
export class ProjectListComponent implements OnInit {
  allProjects: any[] = [];
  projects: any[] = [];
  searchTerm: string = '';
  selectedLevel: string = 'ALL';

  constructor(
    private api: Api,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.api.getProjects().subscribe(data => {
      this.allProjects = data;
      this.projects = data;
    });
  }

  openNewProjectDialog(): void {
    const dialogRef = this.dialog.open(NewProjectDialog, {
      width: '600px',
      panelClass: 'cyber-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('NEW VAULT CONTAINER SHIELD INITIALIZED', 'OK', { duration: 3000 });
        this.loadProjects();
      }
    });
  }

  applyFilters() {
    this.projects = this.allProjects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                          p.department.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchLevel = this.selectedLevel === 'ALL' || p.criticality_level === this.selectedLevel;
      return matchSearch && matchLevel;
    });
  }
}
