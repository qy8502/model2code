import {createEnumArray, createEnumMap, EnumItem, formatDateTime, SearchParam} from "@shared/shared.model";

/**
 * 项目实体
 */
export class ProjectDTO {

    constructor(data?: any) {
        // noinspection TypeScriptValidateTypes
        Object.assign(this, data);
        if (this.editingTime) {
            this.editingTime = new Date(this.editingTime);
        }
    }


    /**
     * 编号
     */
    id: string;

    /**
     * 名称
     */
    name: string;

    /**
     * 项目Git地址
     */
    projectUrl: string;

    /**
     * 编辑者
     */
    editor: string;

    /**
     * 编辑者(级联关系)
     */
    editorName: string;

    /**
     * 编辑者头像(级联关系)
     */
    editorAvatar: string;

    /**
     * 编辑时间
     */
    editingTime: Date;

    /**
     * 编辑时间（格式化字符）
     */
    get editingTimeText(): string {
        return formatDateTime(this.editingTime);
    }

    /**
     * 状态
     */
    status: number;

    /**
     * 状态（标签）
     */
    get statusLabel(): string {
        return EditingStatusMap[this.status].label;
    }

    /**
     * 数据
     */
    data: string;


}


/**
 * 项目分页搜索参数
 */
export class ProjectSearchParam extends SearchParam {

    constructor(data?: any) {
        super();
        // noinspection TypeScriptValidateTypes
        Object.assign(this, data);
    }

    /**
     * 名称
     */
    name?: string;


}

/**
 * 项目用户实体
 */
export class ProjectUserDTO {

    constructor(data?: any) {
        // noinspection TypeScriptValidateTypes
        Object.assign(this, data);
    }


    /**
     * 项目
     */
    projectId: string;

    /**
     * 用户
     */
    userId: string;

    toValue(): string {
        return this.projectId && this.userId ? JSON.stringify({projectId: this.projectId, userId: this.userId}) : null;
    }


}


/**
 * 编辑状态枚举
 */
export const EditingStatusEnum = {

    EDITING: {
        value: 1, label: '正在编辑', color: 'processing'
    },
    FREE: {
        value: 0, label: '空闲', color: 'success'
    }
};
export const EditingStatusMap: { [key: string]: EnumItem } = createEnumMap(EditingStatusEnum);
export const EditingStatusList: EnumItem[] = createEnumArray(EditingStatusEnum);
