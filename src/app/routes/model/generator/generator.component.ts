import {Component, OnInit} from '@angular/core';
import {NzFormatEmitEvent, NzMessageService} from 'ng-zorro-antd';
import {_HttpClient, SettingsService} from '@delon/theme';
import {ModelService, PROJECT_EMPTY} from "../model.service";
import {ModelError, Project} from "../model.model";
import {GeneratorFactory} from "./generator-factory";
import {Code} from "./generator";
import {copy} from "@delon/util";
import {ZipService} from "@delon/abc";
import {JSZip} from "jszip/lib";
import {ProjectDTO} from "@core/project/project.model";
import {createProject} from "../model.helper";
import {ProjectService} from "@core/project/project.service";
import {AvatarService} from "@core/user/avatar.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: 'app-model-generator',
    styleUrls: ['./generator.component.less'],
    templateUrl: './generator.component.html',
    providers: [GeneratorFactory]
})
export class ModelGeneratorComponent implements OnInit {

    constructor(private route: ActivatedRoute, private zip: ZipService, private router: Router,
                private  generatorFactory: GeneratorFactory, public settings: SettingsService,
                public msgSrv: NzMessageService, private projectService: ProjectService, private avatarService: AvatarService,
                public http: _HttpClient, private modelService: ModelService
    ) {
        this.zip.create().then(ret => this.instance = ret);
    }


    codes: Code[];
    searchValue = '';
    project: Project;
    nodes = [];
    selectedCodes: Code[] = [];
    tabIndex = 0;

    copy = copy;
    instance: JSZip | null = null;

    routeParam = {
        projectId: this.route.snapshot.params.projectId || "",
    };
    // 路由数据
    routeData = {
        title: this.route.snapshot.data.title || "",
        subTitle: "",
        project: null as ProjectDTO
    };

    modelError: ModelError;

    back() {
        this.router.navigateByUrl(this.routeParam.projectId ? `/project/${this.routeParam.projectId}/model` : '/model');
    }

    ngOnInit(): void {
        if (this.routeParam.projectId) {
            this.projectService.getProject(this.routeParam.projectId).subscribe((data) => {
                data.editorAvatar = data.editorAvatar || this.avatarService.avatar(data.editor, data.editorName)
                this.routeData.project = data;
                this.routeData.subTitle = `项目：${data.name}`;
                this.modelService.getProjectTemp(this.routeParam.projectId).subscribe((projectTemp) => {
                    this.project = projectTemp;
                    if (!this.project) {
                        this.project = this.routeData.project.data ? createProject(JSON.parse(this.routeData.project.data)) : createProject(PROJECT_EMPTY);
                    }
                    this.generate();
                });
            });
        } else {
            this.modelService.getProjectTemp().subscribe((projectTemp) => {
                this.project = projectTemp;
                if (this.project) {
                    this.generate();
                } else {
                    this.modelService.getProject().subscribe((project) => {
                        this.project = project;
                        try {
                            this.generate();
                        } catch (e) {
                            this.modelError = e;
                            console.error(e);
                        }
                    });
                }
            });
        }
    }

    generate() {
        if (!this.project) {
            return;
        }
        this.project.author = this.settings.user.name;
        this.codes = this.generatorFactory.generateAll(this.project);
        const nodeMap = {};
        const nodes = [];
        this.codes.forEach((code) => {
            let index = 0;
            let lestIndex = 0;
            let childrenMap = nodeMap;
            let children = nodes;
            do {
                index = code.path.indexOf("/", index);
                if (index < 0) {
                    index = code.path.length;
                }
                if (index !== 0) {
                    const title = code.path.substring(lestIndex, index);
                    const key = code.path.substring(0, index);
                    if (!childrenMap[title]) {
                        childrenMap[title] = {title, key};
                        if (index >= code.path.length) {
                            childrenMap[title].isLeaf = true;
                            childrenMap[title].code = code;
                        } else {
                            childrenMap[title].children = [];
                            childrenMap[title].childrenMap = {};
                        }
                        children.push(childrenMap[title]);
                    }
                    children = childrenMap[title].children;
                    childrenMap = childrenMap[title].childrenMap;
                }
                index += 1;
                lestIndex = index;
            }
            while (index < code.path.length)
        });
        this.nodes = nodes;
        delete this.project.author;
    }

    selectCode(event: NzFormatEmitEvent): void {
        if (event.node.origin.code) {
            if (this.selectedCodes.indexOf(event.node.origin.code) < 0) {
                this.selectedCodes.push(event.node.origin.code);
            }
            this.tabIndex = this.selectedCodes.indexOf(event.node.origin.code);
        } else {
            event.node.isExpanded = !event.node.isExpanded;
        }
    }

    closeTab(code: Code) {
        this.selectedCodes.splice(this.selectedCodes.indexOf(code), 1);
    }

    download() {
        this.codes.forEach((code) => {
            this.instance.file(code.path, code.code);
        });
        this.zip.save(this.instance, {filename: this.project.nameDirectory}).then(() => {
            this.msgSrv.success('下载生成代码成功！');
            this.zip.create().then(ret => this.instance = ret);
        });
    }
}
