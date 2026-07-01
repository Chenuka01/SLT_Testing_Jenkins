import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ProjectListComponent } from './components/project-list/project-list';
import { CredentialList } from './components/credential-list/credential-list';

import { ActivityLog } from './components/activity-log/activity-log';
import { BreakGlassComponent } from './components/project-details/break-glass';
import { MfaSetupComponent } from './components/mfa-setup/mfa-setup';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'projects', component: ProjectListComponent, canActivate: [authGuard] },
  { path: 'credentials', component: CredentialList, canActivate: [authGuard] },
  { path: 'logs', component: ActivityLog, canActivate: [authGuard] },
  { path: 'break-glass', component: BreakGlassComponent, canActivate: [authGuard] },
  { path: 'mfa-setup', component: MfaSetupComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
