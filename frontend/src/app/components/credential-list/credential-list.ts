import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NewSecretDialog } from './new-secret-dialog';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './credential-list.html',
  styleUrl: './credential-list.scss',
})
export class CredentialList implements OnInit {
  allCredentials: any[] = [];
  credentials: any[] = [];
  displayedColumns: string[] = ['service_name', 'username', 'type', 'actions'];
  revealedSecrets: { [key: number]: string } = {};

  constructor(private api: Api, private snackBar: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadCredentials();
  }

  loadCredentials(): void {
    this.api.getCredentials().subscribe((data) => {
      this.allCredentials = data;
      this.credentials = [...data];
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.credentials = this.allCredentials.filter(c => 
      c.service_name.toLowerCase().includes(filterValue) || 
      c.target_url_or_ip.toLowerCase().includes(filterValue)
    );
  }

  openNewSecretDialog(): void {
    const dialogRef = this.dialog.open(NewSecretDialog, {
      width: '600px',
      panelClass: 'cyber-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('NEW ASSET SECURED SUCCESSFULLY', 'OK', { duration: 3000 });
        this.loadCredentials();
      }
    });
  }

  requestAccess(id: number): void {
    const reason = prompt('ENTER JUSTIFICATION FOR EMERGENCY ACCESS:');
    if (!reason) return;

    this.api.requestAccess({ credential: id, reason: reason }).subscribe({
      next: () => {
        this.snackBar.open('ACCESS REQUEST TRANSMITTED TO COMMAND CONTROL', 'OK', { duration: 4000 });
      },
      error: () => {
        this.snackBar.open('TRANSMISSION FAILURE. RETRY LATER.', 'ERROR', { duration: 3000 });
      }
    });
  }

  viewSecret(id: number): void {
    const mfaToken = prompt('Enter MFA Token (if enabled):') || undefined;
    
    this.api.revealSecret(id, mfaToken).subscribe({
      next: (res) => {
        this.revealedSecrets[id] = res.secret;
        this.snackBar.open('Secret revealed for 10 seconds.', 'Close', { duration: 3000 });
        
        // Dynamic Masking: Hide after 10 seconds
        setTimeout(() => {
          delete this.revealedSecrets[id];
        }, 10000);
      },
      error: (err) => {
        if (err.status === 403) {
          this.snackBar.open('Access Denied. Please request approval.', 'Close', { duration: 5000 });
        } else if (err.status === 401) {
          this.snackBar.open('MFA Token Required or Invalid.', 'Close', { duration: 3000 });
        }
      }
    });
  }

  copyToClipboard(id: number): void {
    const secret = this.revealedSecrets[id];
    if (secret) {
      navigator.clipboard.writeText(secret).then(() => {
        this.snackBar.open('Secret copied! Clipboard will clear in 15s.', 'OK', { duration: 3000 });
        
        // Clipboard Auto-Clear logic
        setTimeout(() => {
          navigator.clipboard.writeText('');
          this.snackBar.open('Clipboard cleared for security.', 'OK', { duration: 2000 });
        }, 15000);
      });
    }
  }
}
