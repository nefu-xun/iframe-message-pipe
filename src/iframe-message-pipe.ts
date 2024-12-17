export enum MESSAGE_PIPE_OWNER {
    PARENT = 'parent',
    CHILD = 'child'
}

export interface MESSAGE_PIPE_INIT_OPTIONS {
    owner: MESSAGE_PIPE_OWNER,
    trustOrigin: RegExp
}

export interface CALLBACK_OPTIONS {
    value: object,
    type: string
}

export enum CONNECT_STATUS {
    NEW_CONNECT = 'newConnect'
}

export interface NEW_CONNECT_TO_PARENT_OPTIONS {
    type: CONNECT_STATUS.NEW_CONNECT
}

export class MessagePip {

    // 受信任的消息来源(正则匹配形式)
    trustOrigin: RegExp;
    source: MessageEventSource | undefined;
    tasks: Map<String, Array<Function>>;
    owner: MESSAGE_PIPE_OWNER;

    commonCb = (event: MessageEvent) => {
        const { origin, data, source } = event;

        if (!this.trustOrigin.test(origin)) return; // 非信任

        // 接受新连接，清除旧连接
        if (this.source && data?.type === CONNECT_STATUS.NEW_CONNECT) {
            this.source = undefined;
        }

        if (!this.source && this.owner === MESSAGE_PIPE_OWNER.PARENT) { // 子页面成功挂载时的主动通知
            this.source = (source as MessageEventSource); // 保存子页面源对象
            return;
        }
        this.handleCallBack(data);
    }

    constructor(args: MESSAGE_PIPE_INIT_OPTIONS) {
        const { owner, trustOrigin } = args;
        this.owner = owner;
        this.trustOrigin = trustOrigin;
        this.tasks = new Map();

        if (owner === MESSAGE_PIPE_OWNER.PARENT) {
            this.initForParent();
        } else {
            this.initForChild();
        }
    }
    initForParent() {
        window.addEventListener('message', this.commonCb);
    }
    newConnectToParent(opts: NEW_CONNECT_TO_PARENT_OPTIONS) {
        const { type } = opts;
        window.parent.postMessage({ type }, '*'); // 会在接受处进行origin校验
        window.addEventListener('message', this.commonCb);
    }
    initForChild() {
        this.newConnectToParent({
            type: CONNECT_STATUS.NEW_CONNECT,
        });
    }
    handleCallBack(data: CALLBACK_OPTIONS) {
        const { value, type } = data;
        const callbackArr = this.tasks.get(type);
        callbackArr?.forEach(cb => cb(value));
    }
    $on(type: string, cb: Function) {
        if (this.tasks.has(type)) {
            (this.tasks.get(type) as Array<Function>).push(cb);
        } else {
            this.tasks.set(type, [cb]);
        }
    }
    $emit(type: string, value: object) {
        if (this.owner === MESSAGE_PIPE_OWNER.PARENT) {
            this.source?.postMessage({ value, type }, { targetOrigin: '*' });
        } else {
            window.parent.postMessage({ value, type }, '*');
        }
    }
    $off(type: string) {
        this.tasks.delete(type);
    }
    $clear() {
        this.tasks = new Map();
    }
}