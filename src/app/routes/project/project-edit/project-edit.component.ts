import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {FormProperty, PropertyGroup, SFSchema, SFStringWidgetSchema, SFUISchema} from '@delon/form';
import {ProjectService} from "@core/project/project.service";
import {UserService} from "@core/user/user.service";
import {ProjectDTO} from "@core/project/project.model";
import {isUrl} from "@delon/util";

@Component({
    selector: 'app-project-project-edit',
    templateUrl: './project-edit.component.html',
})
export class ProjectProjectEditComponent implements OnInit {

    constructor(
        private modal: NzModalRef,
        private msgSrv: NzMessageService,
        public http: _HttpClient, private projectService: ProjectService, private userService: UserService
    ) {
    }

    get adding(): boolean {
        return !(this.record && this.record.id);
    }

    record: any = {};
    routeData: any = {};
    i: ProjectDTO;
    schema: SFSchema;

    ui: SFUISchema = {
        '*': {
            spanLabelFixed: 100,
            grid: {span: 12},
        }
    };
    buildSchema = () => {
        this.schema = {
            properties: {
                name: {
                    type: 'string', title: '名称',
                    ui: {placeholder: '请填写名称'} as SFStringWidgetSchema
                },
                projectUrl: {
                    type: 'string', title: '项目Git地址',
                    ui: {
                        placeholder: '项目Git地址', grid: {span: 24},
                        validator: (value: any, formProperty: FormProperty, form: PropertyGroup) => {
                            return !form.value || isUrl(form.value.projectUrl) ? [] : [{
                                keyword: 'url',
                                message: '必须是网址'
                            }];
                        }
                    }
                }
            },
            required: ['name'],
        } as SFSchema;
    };

    ngOnInit(): void {
        if (!this.adding) {
            this.projectService.getProject(this.record.id).subscribe((res: ProjectDTO) => {
                this.i = res;
                this.buildSchema();
            });
        } else {
            this.i = this.i || new ProjectDTO();
            this.buildSchema();
        }
    }

    save(value: any) {
        const data = new ProjectDTO(value);
        (this.adding ? this.projectService.addProject(data) : this.projectService.updateProject(this.record.id, data))
            .subscribe(() => {
                this.msgSrv.success(`${this.adding ? '新建' : '编辑'}成功`);
                this.modal.close(value);
            });
    }

    close() {
        this.modal.destroy();
    }
}
