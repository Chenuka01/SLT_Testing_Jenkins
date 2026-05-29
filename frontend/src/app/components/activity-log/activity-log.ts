import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, FormsModule],
  templateUrl: './activity-log.html',
  styleUrl: './activity-log.scss',
})
export class ActivityLog implements OnInit {
  allLogs: any[] = [];
  logs: any[] = [];
  searchTerm: string = '';
  selectedAction: string = 'ALL';
  displayedColumns: string[] = ['timestamp', 'user', 'action', 'description', 'ip'];

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.api.getActivityLogs().subscribe((data) => {
      // Add realistic mock data for SLT demo
      const mockLogs = [
        {
          timestamp: new Date().toISOString(),
          user_name: 'SLT/EMP/001 (Admin)',
          action_type: 'VIEW_SECRET',
          description: 'Decrypted credential for National Backbone Fiber - Nokia Core Switch 01',
          ip_address: '10.1.50.12'
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user_name: 'SLT/EMP/042 (Manager)',
          action_type: 'APPROVE_ACCESS',
          description: 'Approved access request for IPTV Headend Transcoder API',
          ip_address: '10.1.45.88'
        },
        {
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user_name: 'SYSTEM',
          action_type: 'LOGIN',
          description: 'Secure admin session initiated via MFA (TOTP)',
          ip_address: '172.16.0.5'
        },
        {
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          user_name: 'SLT/EMP/001 (Admin)',
          action_type: 'BREAK_GLASS_DEACTIVATED',
          description: 'Emergency "Break-Glass" mode deactivated after maintenance',
          ip_address: '10.1.50.12'
        }
      ];
      this.allLogs = [...mockLogs, ...data];
      this.applyFilters();
    });
  }

  applyFilters() {
    this.logs = this.allLogs.filter(log => {
      const matchSearch = (log.user_name?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) || 
                          (log.description?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
                          (log.ip_address?.toLowerCase() || '').includes(this.searchTerm.toLowerCase());
      const matchAction = this.selectedAction === 'ALL' || log.action_type === this.selectedAction;
      return matchSearch && matchAction;
    });
  }
}
