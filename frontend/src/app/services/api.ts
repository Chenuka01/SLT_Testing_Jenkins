import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private baseUrl = '/api';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<any> {
    return this.http.get(`${this.baseUrl}/projects/`);
  }

  createProject(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/`, data);
  }

  getCredentials(): Observable<any> {
    return this.http.get(`${this.baseUrl}/credentials/`);
  }

  createCredential(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/credentials/`, data);
  }

  revealSecret(id: number, mfaToken?: string): Observable<any> {
    let url = `${this.baseUrl}/credentials/${id}/reveal/`;
    if (mfaToken) {
      url += `?mfa_token=${mfaToken}`;
    }
    return this.http.get(url);
  }

  getAccessRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/requests/`);
  }

  createEnrollmentRequest(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/enrollment-requests/`, data);
  }

  getEnrollmentRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/enrollment-requests/`);
  }

  requestAccess(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/requests/`, data);
  }

  approveRequest(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/requests/${id}/approve/`, {});
  }

  getActivityLogs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/logs/`);
  }

  // --- MFA ENDPOINTS ---
  setupMFA(): Observable<any> {
    const userId = localStorage.getItem('user_id') || 'admin';
    return this.http.post(`${this.baseUrl}/users/setup-mfa/`, { username: userId });
  }

  verifyMFA(token: string): Observable<any> {
    const userId = localStorage.getItem('user_id') || 'admin';
    return this.http.post(`${this.baseUrl}/users/verify-mfa/`, { token, username: userId });
  }

  // --- BREAK-GLASS ENDPOINTS ---
  getBreakGlassEvents(): Observable<any> {
    return this.http.get(`${this.baseUrl}/break-glass/`);
  }

  initiateBreakGlass(reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/break-glass/initiate/`, { reason });
  }

  approveBreakGlass(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/break-glass/${id}/approve/`, {});
  }
}
