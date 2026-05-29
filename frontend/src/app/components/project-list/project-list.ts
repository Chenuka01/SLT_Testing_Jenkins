import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Api } from '../../services/api';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink, FormsModule],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss'
})
export class ProjectListComponent implements OnInit {
  allProjects: any[] = [];
  projects: any[] = [];
  searchTerm: string = '';
  selectedLevel: string = 'ALL';

  constructor(private api: Api) {}

  ngOnInit() {
    this.api.getProjects().subscribe(data => {
      this.allProjects = data;
      this.projects = data;
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
