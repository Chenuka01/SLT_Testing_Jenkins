import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-break-glass',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule, FormsModule],
  templateUrl: './break-glass.html',
  styleUrl: './break-glass.scss',
})
export class BreakGlassComponent implements OnInit {
  events: any[] = [];
  displayedColumns: string[] = ['requested_by', 'reason', 'status', 'approvals', 'actions'];

  constructor(private api: Api, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.api.getBreakGlassEvents().subscribe(data => {
      if (data && data.length > 0) {
        this.events = data;
      } else {
        // Mock Data for Professional UI Demo
        this.events = [
          {
            id: 101,
            requested_by_name: 'Admin_Dilan',
            reason: 'CRITICAL: Backbone Gateway failure in Welikada Node. Standard routing unreachable.',
            is_active: true,
            approval_count: 2,
            requested_at: new Date().toISOString()
          },
          {
            id: 102,
            requested_by_name: 'SEC_AUDIT_BOT',
            reason: 'Heuristic bypass detected in Vault Layer 4. Emergency lockdown override required for forensics.',
            is_active: false,
            approval_count: 3,
            requested_at: '2026-05-28T10:15:00Z'
          },
          {
            id: 103,
            requested_by_name: 'CTO_Office',
            reason: 'Scheduled DR Drill - Full infrastructure failover validation.',
            is_active: false,
            approval_count: 3,
            requested_at: '2026-05-25T09:00:00Z'
          }
        ];
      }
    });
  }

  initiateBreakGlass(): void {
    const reason = prompt('CRITICAL: State the reason for emergency BREAK-GLASS access:');
    if (reason) {
      this.api.initiateBreakGlass(reason).subscribe(() => {
        this.snackBar.open('Break-Glass initiated. Awaiting 3 approvals.', 'OK');
        this.loadEvents();
      });
    }
  }

  approveEvent(id: number): void {
    this.api.approveBreakGlass(id).subscribe({
      next: (res) => {
        this.snackBar.open(`Approved. (Approvals: ${res.current_approvals}/3)`, 'OK');
        this.loadEvents();
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Approval failed.', 'Close');
      }
    });
  }
}
