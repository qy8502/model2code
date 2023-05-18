import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ProAccountSettingsComponent} from './settings/settings.component';
import {ProAccountSettingsBaseComponent} from './settings/base/base.component';
import {ProAccountSettingsSecurityComponent} from './settings/security/security.component';
import {ProAccountSettingsBindingComponent} from './settings/binding/binding.component';
import {ProAccountSettingsNotificationComponent} from './settings/notification/notification.component';

const routes: Routes = [
  {
    path: 'settings',
    component: ProAccountSettingsComponent,
    children: [
      {path: '', redirectTo: 'base', pathMatch: 'full'},
      {
        path: 'base',
        component: ProAccountSettingsBaseComponent,
        data: {titleI18n: 'pro-account-settings'},
      },
      {
        path: 'security',
        component: ProAccountSettingsSecurityComponent,
        data: {titleI18n: 'pro-account-settings'},
      },
      {
        path: 'binding',
        component: ProAccountSettingsBindingComponent,
        data: {titleI18n: 'pro-account-settings'},
      },
      {
        path: 'notification',
        component: ProAccountSettingsNotificationComponent,
        data: {titleI18n: 'pro-account-settings'},
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {
}
