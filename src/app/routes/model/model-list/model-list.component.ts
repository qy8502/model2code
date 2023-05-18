import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {_HttpClient, ModalHelper, SettingsService} from '@delon/theme';
import {Field, FieldTypeForeignList, Model, Module, Project} from "../model.model";
import {createModel, createProject, getModel, jsonProject} from "../model.helper";
import {ModelEditComponent} from "../model-edit/model-edit.component";
import {ModelProcessTableComponent} from "../process-table/process-table.component";
import {ModelService, PROJECT_EMPTY} from "../model.service";
import {ActivatedRoute, Router} from "@angular/router";
import {
    NzContextMenuService,
    NzDropdownMenuComponent,
    NzMessageService,
    NzModalService,
    UploadFile
} from "ng-zorro-antd";

import {JSZip} from "jszip/lib";
import {ZipService} from "@delon/abc";
import {ModelEnumEditComponent} from "../model-enum-edit/model-enum-edit.component";
import {ProjectService} from "@core/project/project.service";
import {EditingStatusEnum, ProjectDTO} from "@core/project/project.model";
import {finalize} from "rxjs/operators";
import {ModuleEditComponent} from "../module-edit/module-edit.component";
import {ProjectEditComponent} from "../project-edit/project-edit.component";
import {copy} from "@delon/util";
import {AvatarService} from "@core/user/avatar.service";

@Component({
    selector: 'app-model-list',
    styleUrls: ['./model-list.component.less'],
    templateUrl: './model-list.component.html',
})
export class ModelListComponent implements OnInit {
    url = `/user`;

    temp = false;
    project: Project = createProject(PROJECT_EMPTY);

    // modelMap: any = {};
    // moduleMap: any = {};

    instance: JSZip | null = null;// 路由参数

    routeParam = {
        projectId: this.route.snapshot.params.projectId || "",
    };
    // 路由数据
    routeData = {
        title: this.route.snapshot.data.title || "",
        subTitle: "",
        project: null as ProjectDTO
    };
    @ViewChild("modelsCanvas", {static: true}) modelsCanvas: ElementRef;
    ctx: CanvasRenderingContext2D;

    constructor(private route: ActivatedRoute, private zip: ZipService, private http: _HttpClient,
                private modal: ModalHelper, private router: Router, public settings: SettingsService,
                private modelService: ModelService, private projectService: ProjectService, private avatarService: AvatarService,
                public msgSrv: NzMessageService, private modalService: NzModalService, private nzContextMenuService: NzContextMenuService) {
        this.zip.create().then(ret => this.instance = ret);
    }

    get editingByOther() {
        return this.routeData.project && this.settings.user &&
            this.routeData.project.status === EditingStatusEnum.EDITING.value && this.settings.user.id !== this.routeData.project.editor
    }

    get editing() {
        return this.routeData.project && this.settings.user &&
            this.routeData.project.status === EditingStatusEnum.EDITING.value && this.settings.user.id === this.routeData.project.editor
    }

    get modelErrorList(): string[] {
        return this.project ? Object.keys(this.project.modelErrorMap) : [];
    }

    ngOnInit() {

        this.ctx = this.modelsCanvas.nativeElement.getContext("2d");
        if (this.routeParam.projectId) {
            this.loadProject();
        } else {
            this.routeData.subTitle = "本地模型";
            this.modelService.getProjectTemp().subscribe((projectTemp) => {
                this.project = projectTemp;
                if (projectTemp) {
                    this.temp = true;
                } else {
                    this.modelService.getProject().subscribe((project) => {
                        this.project = project
                    });
                }
            });
        }
    }

    loadProject() {
        this.projectService.getProject(this.routeParam.projectId).subscribe((data) => {
            data.editorAvatar = data.editorAvatar || this.avatarService.avatar(data.editor, data.editorName)
            this.routeData.project = data;
            this.routeData.subTitle = `项目：${data.name}`;
            this.modelService.getProjectTemp(this.routeParam.projectId).subscribe((projectTemp) => {
                this.project = projectTemp;
                if (projectTemp) {
                    this.temp = true;
                } else {
                    this.project = this.routeData.project.data ? createProject(JSON.parse(this.routeData.project.data)) : createProject(PROJECT_EMPTY);
                }
            });
        });
    }

    getModelColor(model: Model, field: Field): string {
        let findModel;
        try {
            findModel = getModel(this.project.modelMap, field.typeData);
        } catch (e) {
            // console.error(e)
        }
        return findModel ? findModel.color : '#000000';
    }

    modelChanged() {
        // this.modelService.saveModelsTemp(this.models);
        this.modelService.saveProjectTemp(this.project, this.routeParam.projectId).subscribe(() => {
            this.modelService.getProjectTemp(this.routeParam.projectId).subscribe((project) => {
                this.project = project;
            });
        });
        // this.project.models = sortModels(this.project.models);
        // this.project.modelMap = convertModelsToMap(this.project.models);
        // this.project.moduleMap = convertModulesToMap(this.project.modules, this.project.models);
    }

    firstModelOfModule(model: Model) {
        const models = this.project.moduleMap[model.moduleName].models;
        return (models.length > 1 || models[0].name !== models[0].moduleName) && models.indexOf(model) === 0;
    }

    lastModelOfModule(model: Model) {
        const models = this.project.moduleMap[model.moduleName].models;
        return (models.length > 1 && models.indexOf(model) === models.length - 1);
    }


    isForeign(field: Field) {
        return FieldTypeForeignList.indexOf(field.type) >= 0
    }

    showTypeForeign(model: Model, field: Field, event: any) {
        if (field.typeData && this.isForeign(field)) {
            let foreignModel;
            try {
                foreignModel = getModel(this.project.modelMap, field.typeData);
            } catch (e) {
                return;
                // this.modelErrorMap[`${model.name}.${field.name}`] = {model, field, message: e.message};
                // console.error(e);
            }

            let foreignEl;
            document.querySelectorAll(".model")
                .forEach((modelEl) => {
                    const modelName = modelEl.getAttribute("modelName");
                    if (modelName === model.name) {
                        // thisEl = modelEl;
                    } else if (modelName === foreignModel.name) {
                        foreignEl = modelEl;
                    } else {
                        modelEl.classList.add("other");
                    }
                });
            const thisEl = event.target;
            if (thisEl && foreignEl) {
                this.modelsCanvas.nativeElement.width = this.modelsCanvas.nativeElement.parentElement.offsetWidth;
                this.modelsCanvas.nativeElement.height = this.modelsCanvas.nativeElement.parentElement.offsetHeight;
                this.ctx.beginPath();
                // 线段起点位置
                let thisX = foreignEl.offsetLeft + foreignEl.offsetWidth / 2 - thisEl.offsetLeft;
                let thisY = foreignEl.offsetTop + foreignEl.offsetHeight / 2 - thisEl.offsetTop;
                if (Math.abs(thisX) > Math.abs(thisY)) {
                    thisX = thisX > 0 ? thisEl.offsetLeft + thisEl.offsetWidth : thisEl.offsetLeft;
                    thisY = thisEl.offsetTop + thisEl.offsetHeight / 2;
                } else {
                    thisX = thisEl.offsetLeft + thisEl.offsetWidth / 2;
                    thisY = thisY > 0 ? thisEl.offsetTop + thisEl.offsetHeight : thisEl.offsetTop;
                }
                this.ctx.moveTo(thisX, thisY);
                this.ctx.lineTo(foreignEl.offsetLeft + foreignEl.offsetWidth / 2, foreignEl.offsetTop + foreignEl.offsetHeight / 2);
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = foreignModel.color;
                this.ctx.stroke();

                this.ctx.clearRect(thisEl.offsetLeft, thisEl.offsetTop, thisEl.offsetWidth, thisEl.offsetHeight);
                this.ctx.clearRect(foreignEl.offsetLeft, foreignEl.offsetTop, foreignEl.offsetWidth, foreignEl.offsetHeight);

            }
        }
    }

    hideTypeForeign() {
        document.querySelectorAll(".model")
            .forEach((modelEl) => {
                modelEl.classList.remove("other");
            });
        this.ctx.clearRect(0, 0, this.modelsCanvas.nativeElement.width, this.modelsCanvas.nativeElement.height);

    }

    add(enumModel?: boolean) {
        this.modal
            .createStatic(!enumModel ? ModelEditComponent : ModelEnumEditComponent, {project: this.project}, {size: 'xl'})
            .subscribe((result) => result ? this.modelChanged() : null);
    }

    processTable() {
        this.modal
            .createStatic(ModelProcessTableComponent)
            .subscribe((model) => {
                this.modal
                    .createStatic(ModelEditComponent, {project: this.project, i: model}, {size: 'xl'})
                    .subscribe((result) => result ? this.modelChanged() : null);
            });
    }

    edit(model: Model) {
        this.modal
            .createStatic(!model.enum ? ModelEditComponent : ModelEnumEditComponent, {
                project: this.project,
                record: model
            }, {size: 'xl'})
            .subscribe((result) => result ? this.modelChanged() : null);
    }

    delete(model: Model) {
        this.project.models.forEach((item) => {
            for (let i = item.fields.length - 1; i >= 0; i--) {
                const field = item.fields[i];
                if (this.isForeign(field) && getModel(this.project.modelMap, field.typeData) === model) {
                    item.fields.splice(i, 1);
                }
            }
        });
        this.project.models.splice(this.project.models.indexOf(model), 1);
        this.modelChanged();
    }

    save() {
        this.modelService.saveProject(this.project).subscribe(() => {
            this.msgSrv.success("保存成功！");
            this.modelService.saveProjectTemp(null).subscribe(() => {
                this.temp = false;
            });
        });
    }

    revert() {
        if (this.routeParam.projectId) {
            this.project = this.routeData.project.data ? createProject(JSON.parse(this.routeData.project.data)) : createProject(PROJECT_EMPTY);
        } else {
            this.modelService.getProject().subscribe((project) => {
                this.project = project;
            });
        }
        this.temp = false;
    }

    generate() {
        this.router.navigateByUrl(`${this.routeParam.projectId ? `/project/${this.routeParam.projectId}` : ''}/model/generator`);
    }


    beforeUpload = (file: UploadFile): boolean => {
        this.importFile(file).then();
        return false
    };

    async importFile(file: UploadFile) {
        try {
            if (file instanceof File) {
                const data = await this.zip.read(file as File);
                const fileProject = Object.values(data.files as { [key: string]: any }).find((item) => item.name === "project.json");
                if (fileProject) {
                    const content = await fileProject.async("string");
                    const project: Project = JSON.parse(content || 'null');
                    if (project) {
                        this.project = createProject(project);
                        this.modelChanged();
                        this.msgSrv.success('导入模型数据成功！');
                        return false;
                    }
                }
            }
        } catch (e) {
            console.error("模型数据文件错误", e);
        }
        this.msgSrv.error('模型数据文件不正确！');
        return false;
    };


    exportFile() {
        // console.log(JSON.stringify(this.project));
        this.instance.file("project.json", jsonProject(this.project));
        this.zip.save(this.instance, {filename: `${this.project.name || '模型项目文件'}.m2c`}).then(() => {
            this.msgSrv.success('导出模型数据成功！');
            this.zip.create().then(ret => this.instance = ret);
        });
    }

    exportLocal() {
        this.modalService.confirm({
            nzTitle: '<i>是否确定导出到本地模型?</i>',
            nzContent: '<b>导出到本地模型会覆盖现有的内容，请确保模型（本地）中的内容已经妥善保存。</b>',
            nzOnOk: () => {
                this.save();
            }
        });
    }


    editProject() {
        this.modal
            .createStatic(ProjectEditComponent, {record: this.project})
            .subscribe((result) => result ? this.modelChanged() : null);
    }

    editModule(module: Module) {
        this.modal
            .createStatic(ModuleEditComponent, {project: this.project, record: module})
            .subscribe((result) => result ? this.modelChanged() : null);
    }

    cleanProject() {
        this.modalService.confirm({
            nzTitle: '<i>是否确定清空模型项目?</i>',
            nzContent: '<b>清空模型项目前，请确保当前模型已经导出文件并妥善保存。</b>',
            nzOnOk: () => {
                this.project = createProject(PROJECT_EMPTY);
                // this.modal
                //   .createStatic(ProjectEditComponent, {record: newProject})
                //   .subscribe((result) => {
                //     if (result) {
                //       this.project = newProject;
                //       this.modelChanged();
                //     }
                //   });
            }
        });
    }

    getEllipsisRows(): number {
        return 5;
    }

    pasteModel(data: string) {
        console.log("?????????????????????")
        try {
            const model = createModel(JSON.parse(data));
            this.modal
                .createStatic(ModelEditComponent, {project: this.project, i: model}, {size: 'xl'})
                .subscribe((result) => result ? this.modelChanged() : null);
        } catch (e) {
            this.msgSrv.warning(`剪贴板内容不正确，无法粘贴模型。`);
        }
    }

    copyModel(model: Model) {
        copy(JSON.stringify(model)).then(() =>
            this.msgSrv.success(`已复制${model.name}模型，模型区域内按Ctrl+V键粘贴为新模型。`)
        );
    }

    checkOut() {
        const ok = () => {
            this.projectService.checkOutProject(this.routeParam.projectId)
                .pipe(finalize(() => this.loadProject())).subscribe(() => {
                this.modelService.saveProjectTemp(null, this.routeParam.projectId).subscribe(() => {
                    this.temp = false;
                });
            })
        };
        this.modelService.getProjectTemp(this.routeParam.projectId).subscribe((projectTemp) => {
            if (projectTemp) {
                this.modalService.confirm({
                    nzTitle: '<i>是否确定获取最新模型项目并编辑?</i>',
                    nzContent: '<b>您有临时修改的内容，“获取编辑”将会获取服务器端的模型信息并覆盖掉当前临时修改的内容。在“获取编辑”之前，您可以通过“导出模型项目文件”或“导出到本地模型”妥善处理您临时修改内容，。</b>',
                    nzOnOk: ok
                });
            } else {
                ok();
            }
        });
    }

    checkIn() {
        this.projectService.checkInProject(this.routeParam.projectId, new ProjectDTO({data: jsonProject(this.project)}))
            .pipe(finalize(() => this.loadProject())).subscribe(() => {
            this.msgSrv.success("提交保存成功！");
            this.modelService.saveProjectTemp(null, this.routeParam.projectId).subscribe(() => {
                this.temp = false;
            });
        });
    }

    contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent) {
        this.nzContextMenuService.create($event, menu);
    }

    resetPasteZone(pasteZone: HTMLLIElement) {
        pasteZone.innerHTML = "粘贴模型(按Ctrl+V)";
    }
}
