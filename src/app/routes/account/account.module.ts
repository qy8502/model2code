import {NgModule} from '@angular/core';

import {SharedModule} from '@shared';
import {AccountRoutingModule} from './account-routing.module';


import {ProAccountSettingsComponent} from './settings/settings.component';
import {ProAccountSettingsBaseComponent} from './settings/base/base.component';
import {ProAccountSettingsSecurityComponent} from './settings/security/security.component';
import {ProAccountSettingsBindingComponent} from './settings/binding/binding.component';
import {ProAccountSettingsNotificationComponent} from './settings/notification/notification.component';
import {UserSetPasswordComponent} from "./settings/security/set-password/set-password.component";
import {UserSetPhoneComponent} from "./settings/security/set-phone/set-phone.component";

const COMPONENTS = [
  ProAccountSettingsComponent,
  ProAccountSettingsBaseComponent,
  ProAccountSettingsSecurityComponent,
  ProAccountSettingsBindingComponent,
  ProAccountSettingsNotificationComponent,
];

const COMPONENTS_NOROUNT = [UserSetPasswordComponent, UserSetPhoneComponent];

@NgModule({
  imports: [SharedModule, AccountRoutingModule],
  declarations: [...COMPONENTS, ...COMPONENTS_NOROUNT],
  entryComponents: COMPONENTS_NOROUNT,
})
export class AccountModule {
}
