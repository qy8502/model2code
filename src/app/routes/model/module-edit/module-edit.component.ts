import {Component, OnInit, ViewChild} from '@angular/core';
import {NzModalRef, NzMessageService} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFSchema, SFUISchema} from '@delon/form';
import {Module, Project} from "../model.model";
import {updateModelsModule} from "../model.helper";
import {toPascal} from "../name.helper";

@Component({
  selector: 'app-module-edit',
  templateUrl: './module-edit.component.html',
})
export class ModuleEditComponent implements OnInit {
  record: Module = new Module();
  project: Project;
  i: Module;
  schema: SFSchema = {
    properties: {
      name: {type: 'string', title: '名称'},
      comment: {type: 'string', title: '描述'},
    },
    required: ['name', 'comment'],
  };
  ui: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: {span: 12},
    },
    $no: {
      widget: 'text'
    },
    $href: {
      widget: 'string',
    },
    $description: {
      widget: 'textarea',
      grid: {span: 24},
    },
  };

  constructor(
    private modal: NzModalRef,
    private msgSrv: NzMessageService,
    public http: _HttpClient,
  ) {
  }

  ngOnInit(): void {
    const res = new Module();
    Object.keys(this.schema.properties).forEach((key) => res[key] = this.record[key]);
    this.i = res;
  }

  save(value: any) {
    console.log(this.i);
    value.name = toPascal(value.name);
    const oldName = this.record.name;
    if (value.name !== oldName) {
      this.record.name = value.name;
      updateModelsModule(this.project, oldName, value.name);
    }
    this.record.comment = value.comment;
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
