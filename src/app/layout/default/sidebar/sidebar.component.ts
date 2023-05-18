import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {SettingsService} from '@delon/theme';
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

@Component({
  selector: 'layout-sidebar',
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();

  constructor(public settings: SettingsService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    const {settings, unsubscribe$} = this;
    settings.notify.pipe(takeUntil(unsubscribe$)).subscribe(() => this.cdr.detectChanges());
  }

  ngOnDestroy() {
    const {unsubscribe$} = this;
    unsubscribe$.next();
    unsubscribe$.complete();
  }
}
