import {Component, OnInit, ViewChild} from '@angular/core';
import {NzModalRef, NzMessageService} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFSchema, SFUISchema} from '@delon/form';
import {Project} from "../model.model";

@Component({
  selector: 'app-project-edit',
  templateUrl: './project-edit.component.html',
})
export class ProjectEditComponent implements OnInit {
  record: Project = new Project();
  i: Project;
  schema: SFSchema = {
    properties: {
      name: {type: 'string', title: '项目名称'},
      comment: {type: 'string', title: '项目描述'},
      package: {type: 'string', title: '包名'},
      packageCommon: {type: 'string', title: '公共组件包名'},
      domain: {type: 'string', title: '域名'}
    },
    required: ['name', 'comment', 'package', 'packageCommon'],
  };
  ui: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: {span: 12},
    }
  };

  constructor(
    private modal: NzModalRef,
    private msgSrv: NzMessageService,
    public http: _HttpClient,
  ) {
  }

  ngOnInit(): void {
    const res = new Project();
    Object.keys(this.schema.properties).forEach((key) => res[key] = this.record[key]);
    this.i = res;
  }

  save(value: any) {
    Object.keys(this.schema.properties).forEach((key) => this.record[key] = value[key]);
    this.modal.close(true);
    // this.http.post(`/user/${this.record.id}`, value).subscribe(res => {
    //   this.msgSrv.success('保存成功');
    //   this.modal.close(true);
    // });
  }

  close() {
    this.modal.destroy();
  }
}
