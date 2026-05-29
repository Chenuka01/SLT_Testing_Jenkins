import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ProjectListComponent } from './components/project-list/project-list';
import { CredentialList } from './components/credential-list/credential-list';

import { ActivityLog } from './components/activity-log/activity-log';
import { BreakGlassComponent } from './components/project-details/break-glass';
import { MfaSetupComponent } from './components/mfa-setup/mfa-setup';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'projects', component: ProjectListComponent },
  { path: 'credentials', component: CredentialList },
  { path: 'logs', component: ActivityLog },
  { path: 'break-glass', component: BreakGlassComponent },
  { path: 'mfa-setup', component: MfaSetupComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
