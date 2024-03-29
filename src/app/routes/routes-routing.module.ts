import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {JWTGuard} from '@delon/auth';
import {environment} from '@env/environment';
// layout
import {LayoutDefaultComponent} from '../layout/default/default.component';
import {LayoutPassportComponent} from '../layout/passport/passport.component';
// dashboard pages
// passport pages
import {UserLoginComponent} from './passport/login/login.component';
import {UserRegisterComponent} from './passport/register/register.component';
import {UserRegisterResultComponent} from './passport/register-result/register-result.component';
// single pages
import {CallbackComponent} from './callback/callback.component';
import {UserLockComponent} from './passport/lock/lock.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutDefaultComponent,
    // canActivate: [SimpleGuard],
    children: [
      {path: 'exception', loadChildren: () => import('./exception/exception.module').then(m => m.ExceptionModule)},
      // 业务子模块
      {
        path: 'project',
        canActivateChild: [JWTGuard],
        loadChildren: () => import('./project/project.module').then(m => m.ProjectModule)
      },
      {
        path: 'user',
        canActivateChild: [JWTGuard],
        loadChildren: () => import('./user/user.module').then(m => m.UserModule)
      },
      {
        path: 'account',
        canActivateChild: [JWTGuard],
        loadChildren: () => import('./account/account.module').then(m => m.AccountModule)
      },
      {path: 'model', loadChildren: () => import('./model/model.module').then(m => m.ModelModule)},
      {path: '', redirectTo: '/model', pathMatch: 'full'},
    ]
  },
  // 全屏布局
  // {
  //     path: 'fullscreen',
  //     component: LayoutFullScreenComponent,
  //     children: [
  //     ]
  // },
  // passport
  {
    path: 'passport',
    component: LayoutPassportComponent,
    children: [
      {path: 'login', component: UserLoginComponent, data: {title: '登录'}},
      {path: 'register', component: UserRegisterComponent, data: {title: '注册'}},
      {path: 'register-result', component: UserRegisterResultComponent, data: {title: '注册结果'}},
      {path: 'lock', component: UserLockComponent, data: {title: '锁屏'}},
    ]
  },
  // 单页不包裹Layout
  {path: 'callback/:type', component: CallbackComponent},
  {path: '**', redirectTo: 'exception/404'},
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes, {
        useHash: environment.useHash,
        // NOTICE: If you use `reuse-tab` component and turn on keepingScroll you can set to `disabled`
        // Pls refer to https://ng-alain.com/components/reuse-tab
        scrollPositionRestoration: 'top',
      }
    )],
  exports: [RouterModule],
})
export class RouteRoutingModule {
}
