import Emittery from 'emittery';
import * as fastify from 'fastify';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { ReadStream, Stats } from 'node:fs';
import { Buffer as Buffer$1 } from 'node:buffer';
import { ISchema, SchemaProperties } from '@formily/react';
import * as http from 'http';
import { AuthenticationClient, RestClient } from '@directus/sdk';
import pino, { Level } from 'pino';
import Keyv from 'keyv';
import { StreamChatReq, CozeAPI, CreateChatData, StreamChatData } from '@coze/api';
import OpenAI, { ClientOptions } from 'openai';
import * as typeorm from 'typeorm';
import { DataSource } from 'typeorm';
import ffmpeg from 'fluent-ffmpeg';
import { ReadStream as ReadStream$1 } from 'fs';

interface IAsyncFile {
    getFormat(): "text" | "binary";
    asBuffer(): Promise<Buffer$1 | undefined>;
    asPath(): Promise<string | undefined>;
    asLocalPath(): Promise<string>;
    /**
     * 确保该文件可以通过url访问，该文件将被复制到public/temp/目录下，同时根据config中httpUrl生成访问路径
     */
    asUrl(): Promise<string>;
    asBase64(): Promise<string | undefined>;
    asText(): Promise<string>;
    asReadStream(): Promise<ReadStream>;
    info(): Promise<Stats>;
    get name(): string;
    isAsyncFile(): boolean;
}
interface IAsyncFileSource {
    /**
     * 文件内容或者路径
     */
    data: Buffer$1 | string;
    /**
     * 当路径是一个url的时候，类型为path
     */
    type: "buffer" | "path" | "base64" | "text";
    name: string;
    textEncoding?: BufferEncoding;
}
type AsyncFileLoader = () => Promise<IAsyncFileSource>;
declare class AsyncFile implements IAsyncFile {
    protected loader: AsyncFileLoader;
    protected format: "text" | "binary";
    /**
     * init async file.use loader to load init data.
     * @param loader
     * @param format
     */
    constructor(loader: AsyncFileLoader, format: "text" | "binary");
    protected tempDir: string;
    protected buffer: Buffer$1 | undefined;
    protected path: string | undefined;
    protected localPath: string;
    protected base64: string | undefined;
    protected text: string | undefined;
    protected textEncoding: BufferEncoding | undefined;
    protected _name: string;
    protected url: string;
    protected _info: Stats;
    protected loaded: boolean;
    get name(): string;
    protected load(): Promise<void>;
    protected setSource({ data, type, name, textEncoding }: IAsyncFileSource): Promise<void>;
    protected loadBufferFromPath(localPath: string): Promise<Buffer$1>;
    protected saveFile(uri?: string): Promise<string>;
    saveAs(dir: string, bucket: string, name?: string, onCompleted?: () => void): string;
    getFormat(): "text" | "binary";
    asBuffer(): Promise<Buffer$1 | undefined>;
    asPath(): Promise<string>;
    asBase64(): Promise<string>;
    asText(): Promise<string>;
    asUrl(): Promise<string>;
    asLocalPath(): Promise<string>;
    asReadStream(): Promise<ReadStream>;
    info(): Promise<Stats>;
    isAsyncFile(): boolean;
    toString(): string;
    /**
     * 从本地路径或者网络url创建
     * @param userPath
     * @param format
     * @returns
     */
    static fromPath(userPath: string, format?: "text" | "binary", fileName?: string, textEncoding?: BufferEncoding): AsyncFile;
    /**
     * 从buffer创建
     * @param buffer
     * @param format
     * @returns
     */
    static fromBuffer(buffer: Buffer$1, name?: string, format?: "text" | "binary", textEncoding?: BufferEncoding): AsyncFile;
}

interface IModelInfo {
    id: string;
    user_created: string;
    date_created: any;
    user_updated?: string;
    date_update?: any;
    name: string;
    desc?: string;
}
declare enum SimpleSchemaType {
    text = "text",
    number = "number",
    boolean = "boolean",
    radio = "radio",
    check = "check",
    select = "select",
    date = "date",
    image = "image",// 使用图片链接
    video = "video",// 使用视频链接
    audio = "audio",// 使用音频链接
    url = "url",
    email = "email",
    phone = "phone",
    ipv4 = "ipv4"
}
interface ISimpleSchemaItem {
    [key: string]: string | string[] | number[] | ISimpleSchemaItem;
}
interface IConfigSchema {
    type?: "simple" | "formily";
    simple?: ISimpleSchemaItem;
    formily?: ISchema;
}
declare const SchemaBaseProperties: {
    instanceName: {
        type: string;
        title: string;
        "x-order": number;
        "x-decorator": string;
        "x-component": string;
        "x-component-props": {
            placeholder: string;
        };
        "x-decorator-props": {
            tooltip: string;
        };
    };
};
interface IConfigParams {
    /**
     * 类型的名称（非实例名称），所有该类型的实例都一样
     */
    name: string;
    desc?: string;
    /**
     * 公共目录的相对路径，如 /public/images/logo.png
     */
    logoPath?: string;
    /**
     * 实例属性配置的结构
     */
    optionsSchema: IConfigSchema;
    supported?: {
        groupInAndOut?: boolean;
        inTypes?: SourceChatMessageType[];
        outTypes?: SourceChatMessageType[];
    };
    /**
     * 使用文档地址
     */
    readMeUrl?: string;
}
declare const config: {
    port: number;
    host: string;
    wsUrl: string;
    httpUrl: string;
    privateHttpUrl: string;
    privateWsUrl: string;
    /**
     * 公共资源路径，在本机的路径
     */
    publicPath: string;
    /**
     * 公共资源访问的路径名
     */
    publicPathName: string;
    tempDir: string;
    redisUrl: string;
    offline: boolean;
    configServerUrl: string;
    configServerEmail: string;
    configServerPassword: string;
    publicToken: string;
    publicForceAuth: boolean;
    secretFile: string;
    traceHttpRequest: boolean;
    npmRegistry: string;
    npmTimeout: number;
    serverCompress: boolean;
    serverCompressMinSize: number;
    serverCompressMime: string[];
    dataPath: string;
    dbProvider: string;
    dbConnection: string;
    minioMessageBucket: string;
};

interface IInstanceCreateOptions {
    /**
     * 用来区分不同实例的全局唯一key
     */
    instanceName?: string;
}
interface IInstanceBaseMangerOptions {
    /**
     * 是否缓存实例，默认true。false的时候每次都会创建新的实例，需要自行处理实例名称重复逻辑
     */
    cacheInstance?: boolean;
}
interface IInstance {
    get options(): IInstanceCreateOptions;
    get params(): IConfigParams;
}
declare abstract class InstanceBaseManager<InstanceType extends IInstance, CreatorType extends (...args: any[]) => any, CreateOptionsType extends IInstanceCreateOptions, TParams extends IConfigParams> {
    protected options?: IInstanceBaseMangerOptions;
    private _instances;
    private _creators;
    private _params;
    constructor(options?: IInstanceBaseMangerOptions);
    /**
     * 消息源创建器注册。一般由插件进行注册。
     * @param name
     * @param creator
     */
    registerInstanceCreator(creator: CreatorType, params: TParams): void;
    /**
     * 根据固有名称获取其相关参数
     * @param name
     */
    getParams(name: string): TParams;
    getAllParams(): {
        [key: string]: TParams;
    };
    getAllParamsArray(): TParams[];
    /**
     * 只有允许缓存实例的管理器才能够获取到创建过的实例
     * @param instanceName
     * @returns
     */
    getInstance(instanceName: string): InstanceType;
    /**
     * 获取某个类型的所有的实例
     * @param typeName 类型名称
     */
    getInstances(typeName?: string): InstanceType[];
    /**
     * 创建实例
     * @param name
     * @param options
     * @returns
     */
    createInstance(name: string, options: CreateOptionsType): InstanceType;
    clearInstances(): Promise<void>;
}

/**
 * 一个source可以有多个实例，比如不同的api地址，由用户配置
 */
interface ISourceOptions extends IInstanceCreateOptions {
    /**
     * 离线后是否自动重新请求登陆，默认false
     */
    autoReLogin?: boolean;
}
/**
 * params应该由source供应商提供
 */
interface ISourceParamas extends IConfigParams {
    /**
     * @ 相关功能的时候，atList里面是用户信息的哪个字段，默认是userId，不同的source可能会有区别，可以在此配置
     *
     * 可以配置的值有：userName userId nickName
     */
    fieldInAtList?: "userName" | "userId" | "nickName";
    /**
     * 可以被外界监听的消息类型
     * 内置类型可以从SourceEventTypes中选择，也可以加入自定义类型。
     */
    eventNames: string[];
    /**
     * 是否不要在@的时候自动加上@fieldInAtList的值。默认false，即不会自动附加。
     */
    autoAppendAt?: boolean;
}
/**
 * 消息源的路由和ws处理器信息
 */
interface ISourceActionInfo {
    actionName: string;
    type: "api" | "ws";
    action: ISourceApiAction | SourceWSNormalAction | SourceWSCustomAction;
    /**
     * 是否需要
     */
    needAuth?: boolean;
}
/**
 * 消息源的实现类
 */
interface ISource extends IInstance {
    /**
     * 这个Source的固有属性，比如source的平台名称
     */
    get params(): ISourceParamas;
    /**
     * 初始化过程中的动态参数
     */
    get options(): ISourceOptions;
    /**
     * 消息源的路由和ws处理器列表，需要在消息源的构造函数阶段创建
     */
    get actions(): ISourceActionInfo[];
    /**
     * 用户发布订阅事件的对象，事件类型为SourceEventType
     */
    event: Emittery;
    /**
     * 获取当前登录用户的个人信息
     */
    me(force?: boolean): Promise<ISourceUserInfo>;
    /**
     * 执行登录，如果有需要扫码等，应发出全局TODO事件，登录成功后发出LOGIN消息，并携带用户信息
     */
    login(): Promise<void>;
    /**
     * 发送消息，如果返回内容不为空，说明发送失败
     * @param message 要发送的消息
     * @param fromMessage 该条消息如果是对某条消息的响应，可以传入原始消息。某些平台可能只允许被动发送消息，此时可能需要用到原始触发回复的那条消息。
     */
    sendMessage(message: ISourceChatMessage, fromMessage?: ISourceChatMessage): Promise<string>;
    /**
     * 获取用户信息，至少返回nickName
     * @param mode all返回全部，user仅返回个人用户，group仅返回群组
     * @param 是否强刷
     */
    getContacts(mode: "all" | "user" | "group", force?: boolean): Promise<({
        nickName: string;
    } & Partial<ISourceUserInfo>)[]>;
    /**
     * 根据获取联系人列表接口返回的粗略信息
     * @param baseInfo
     */
    getContactDetail(baseInfo: ISourceUserInfo): Promise<ISourceUserInfo>;
    /**
     * 是否是登录状态。仅被用来检查登录状态，未登录不代表出错，也可能是正处于登录中。
     */
    hasLogin(): boolean;
    /**
     * 当agent把内容送给bot回复之前。可以用来做一系列的准备工作，如提前下发卡片stream卡片。
     */
    beforeSend?(sourceMessage: ISourceChatMessage): Promise<void>;
    /**
     * 当agent把内容发送给bot之后，可以用来给source释放相关资源，如结束卡片的写入状态。
     * @param sourceMessage
     */
    afterSend?(sourceMessage: ISourceChatMessage): any;
}
type SourceCreator = (options: ISourceOptions) => ISource;
declare enum SourceEventType {
    CHAT_MESSAGE = "CHAT_MESSAGE",
    RESPONSE_MESSAGE = "RESPONSE_MESSAGE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    GROUP_INFO_CHANGED = "GROUP_INFO_CHANGED",
    SYSTEM = "SYSTEM",
    /**
     * 非robot发送的消息
     */
    SELF_SEND = "SELF_SEND",
    /**
     * 第一次展开对话，并非所有消息源都会支持
     */
    FIRST_CHAT = "FIRST_CHAT",
    /**
     * 新用户进群
     */
    GROUP_NEW_USER = "GROUP_NEW_USER",
    /**
     * 每次消息源中激活与机器人的对话
     */
    ENTER_CHAT = "ENTER_CHAT",
    CUSTOM = "CUSTOM"
}
/**
 * 消息源发布的事件，通过websocket传到客户端
 */
interface ISourceEventData {
    id: string;
    type: SourceEventType;
    origin?: any;
    source: ISource;
    me: ISourceUserInfo;
}
/**
 * 需要用户交互完成的事项，如扫码，验证码登，前端收集后提交后端进行继续处理
 */
interface ISourceTodoEventData extends ISourceEventData {
    todo: {
        [key: string]: {
            schema: IConfigSchema;
            data: any;
        };
    };
}
/**
 * 聊天消息到达事件，主要分为群聊和单聊
 */
interface ISourceChatMessageEventData extends ISourceEventData {
    message: ISourceChatMessage;
    /**
     * 当bot开始生成时，该方法被调用，以便source可以执行相关状态变更
     * 请勿在此执行异步逻辑来发送消息
     * @returns
     */
    onGenerating?: () => void;
}
interface ISourceResponseMessageEventData extends ISourceEventData {
    message: ISourceChatMessage;
    fromMessage?: ISourceChatMessage;
}
/**
 * 用户登录的消息
 */
interface ISourceLoginEventData extends ISourceEventData {
    user: ISourceUserInfo;
}
/**
 * 用户登出消息
 */
interface ISourceLogoutEventData extends ISourceEventData {
    user: ISourceUserInfo;
}
/**
 * 群组信息发生变化的消息
 */
interface ISourceGroupInfoChangedEventData extends ISourceEventData {
    groupInfo: ISourceUserInfo;
}
/**
 * 系统消息，主要指全局系统消息，非聊天中的系统消息
 */
interface ISourceSystemEventData extends ISourceEventData {
    content: any;
}
declare enum SourceChatMessageType {
    /**
     * 文本或者Markdown
     */
    TEXT = "TEXT",
    /**
     * 图文混排，数据结构是数组。
     * 该类型主要适配部分接收的消息源，如钉钉。bot回复的内容如果有图文，建议使用Markdown形式。
     */
    RICH_TEXT = "RICH_TEXT",
    IMAGE = "IMAGE",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    ARTICLE = "ARTICLE",
    MUSIC = "MUSIC",
    FILE = "FILE",
    EMOTION = "EMOTION",
    /**
     * 小程序
     */
    MP = "MP",
    /**
     * 引用消息
     */
    REF = "REF",
    POSITION = "POSITION",
    PHONE = "PHONE",
    FRIEND_REQUEST = "FRIEND_REQUEST",
    /**
     * 名片
     */
    CONTACT_CARD = "CONTACT_CARD",
    /**
     * 应用卡片
     */
    CARD = "CARD",
    RECALL = "RECALL",
    PAT = "PAT",
    SYSTEM = "SYSTEM",
    /**
     * 订阅，主要用于类似公众号的场景
     */
    SUBSCRIBE = "SUBSCRIBE",
    /**
     * 取消订阅，主要用于类似公众号的场景
     */
    UNSUBSCRIBE = "UNSUBSCRIBE",
    CUSTOM = "CUSTOM"
}
interface ISourceUserInfo {
    /**
     * 用户名
     */
    userName: string;
    /**
     * 用户昵称（如果有备注就是备注名称）
     */
    nickName?: string;
    /**
     * 头像地址
     */
    avatarUrl?: string;
    /**
     * 大头像地址
     */
    bigAvatarUrl?: string;
    /**
     * 唯一ID
     */
    userId: string;
    /**
     * 用户签名
     */
    signature?: string;
    /**
     * 自定义信息
     */
    origin?: any;
    /**
     * 是否是群组
     */
    isGroup?: boolean;
}
type SourceChatImageContent = {
    file: IAsyncFile;
};
type SourceChatTextContent = string;
/**
 * 富文本格式。与Markdown的区别是Markdown以纯文本传输，富文本中的图像是直接嵌入为file的，富文本只支持图文的有序排列。
 */
type SourceChatRichTextContent = {
    content: {
        type: "text" | "image" | "video" | "custom" | "at" | "file";
        data: SourceChatTextContent | SourceChatImageContent | SourceChatVideoContent | string;
        customData?: any;
    }[];
    title?: string;
};
type SourceChatAudioContent = {
    /**
     * 音频需为wav格式。
     */
    file: IAsyncFile;
    /**
     * 语音转成的文本
     */
    text?: string;
};
type SourceChatFileContent = {
    file: IAsyncFile;
    sizeInBytes?: number;
    title?: string;
    desc?: string;
};
type SourceChatMusicContent = SourceChatFileContent & {
    coverUrl?: string;
    signer?: string;
    album?: string;
    url?: string;
};
type SourceChatVideoContent = SourceChatFileContent & {
    previewImage?: IAsyncFile;
};
type SourceChatPositionContent = {
    placeName: string;
    lon: number;
    lat: number;
    placeDetail: string;
    mapLevel?: number;
};
type SourceChatArticleContent = {
    thumbFile?: IAsyncFile;
    title: string;
    url: string;
    coverFile?: IAsyncFile;
    desc?: string;
    source?: string;
};
/**
 * 如果是一张动图，那么previewUrl通常是一个预览的静态图。url是实际动图。
 */
type SourceChatEmotionContent = {
    url?: string;
    previewUrl: string;
    file: IAsyncFile;
};
/**
 * 用户名片
 */
type SourceChatContactContent = {
    display: string;
    smallImageUrl: string;
    bigImageUrl?: string;
    custom?: any;
};
/**
 * 小程序消息
 */
type SourceChatMPContent = {
    title: string;
    displayName?: string;
    desc?: string;
    openUrl: string;
    openRelativePath?: string;
    cover?: IAsyncFile;
    iconUrl?: string;
    id?: string;
};
/**
 * 引用消息，当前仅支持以文本来回复引用消息
 * 引用消息可以套娃，使用的时候要注意识别
 */
type SourceChatRefContent = {
    text: SourceChatTextContent;
    refMessage?: ISourceChatMessage;
};
type SourceChatRecallContent = {
    display: string;
    sourceMessageId: string;
    sourceContent?: SourceChatContent;
};
type SourceChatPatContentType = {
    text: string;
};
type SourceChatSubscribeContent = {
    isSubscribe: boolean;
};
type SourceChatSystemContent = {
    data: any;
};
type SourceChatPhoneContent = {
    title: string;
    time: Date;
};
type SourceChatCardContent = {
    /**
     * 卡片的类型。
     * - templateId表示使用模板id，这时候template是id的值，content是绑定的变量
     * - template表示使用模板，这时候template提供模板结构，content提供变量对象
     * - content表示直接使用完整的卡片内容，这时候template为空
     */
    type: "template" | "templateId" | "content";
    /**
     * 卡片的模板结构，变量使用{var}的方式进行占位。
     *
     * 如果type类型是template，则表示模板的id
     *
     * type是content时可不设置
     */
    template?: string;
    /**
     * 卡片的完整内容或者绑定的变量体
     */
    content: any;
    /**
     * 卡片交互结果，一般用户交互回调后才有
     */
    result?: any;
};
type SourceChatContent = SourceChatTextContent | SourceChatImageContent | SourceChatAudioContent | SourceChatPositionContent | SourceChatFileContent | SourceChatEmotionContent | SourceChatVideoContent | SourceChatMusicContent | SourceChatArticleContent | SourceChatContactContent | SourceChatMPContent | SourceChatRefContent | SourceChatRecallContent | SourceChatSubscribeContent | SourceChatRichTextContent | SourceChatSystemContent | SourceChatPhoneContent | SourceChatCardContent;
interface ISourceChatMessage {
    type: SourceChatMessageType;
    content: SourceChatContent;
    time?: Date;
    /**
     * 消息来源ID，如果是个人消息，同senderId，如果是群消息，是群Id
     */
    fromId?: string;
    /**
     * 发消息人的ID
     */
    senderId?: string;
    /**
     * 发消息的用户名（一般也是唯一），不管是群消息还是个人消息，都应该是发送者（个人）的名称
     */
    senderName?: string;
    isGroupChat: boolean;
    isSender?: boolean;
    senderInfo?: ISourceUserInfo;
    /**
     * 如果是群消息，则是群信息（具体使用哪个字段发送由source决定）
     */
    toInfo: ISourceUserInfo[];
    origin?: any;
    messageId?: string;
    atList?: string[];
    error?: string;
    /**
     * 自定义类型时的名称
     */
    customType?: string;
    /**
     * 消息状态，仅用于标记大模型返回的消息。reasoning表示推理过程消息，content表示回复的消息。为空表示content。
     */
    status?: "reasoning" | "content";
}
interface ISourceGroupChatMessage extends ISourceChatMessage {
    groupInfo: ISourceUserInfo;
    isAdmin?: boolean;
    isOwner?: boolean;
}
declare class SourceApiNotFoundError extends Error {
}
declare class SourceApiMissingParamsError extends Error {
}
declare class SourceApiUnAuthorizedError extends Error {
}
type ISourceApiResponseType = "normal" | "custom";
interface ISourceApiAction {
    /**
     * 当type为normal时，将不会接收到rep，直接异步返回要响应的json即可
     * 当type为custom时，需要自行处理reply的内容
     */
    type: ISourceApiResponseType;
    /**
     * 当type为normal时，将不会接收到rep，直接异步返回要响应的json即可
     * 当type为custom时，需要自行处理reply的内容
     * @param req
     * @param rep
     * @returns
     */
    handler: (req: FastifyRequest, rep?: FastifyReply) => Promise<any>;
}
interface ISourceWSNormalInMessage {
    instanceName: string;
    action: string;
    /**
     * id用来识别此次调用
     */
    id: string;
    data: any;
}
interface ISourceWSNormalOutMessage {
    error?: string;
    data?: any;
    id: string;
}
/**
 * 收到的是纯JSON数据
 */
type SourceWSNormalAction = (message: any) => Promise<any>;
/**
 * 收到的是原始消息
 */
type SourceWSCustomAction = {
    /**
     *
     * @param message
     * @param req
     * @param socket
     * @returns
     */
    onMessage: (message: any, req: FastifyRequest, socket: WebSocket) => Promise<void>;
    onOpen?: (req: FastifyRequest, socket: WebSocket) => Promise<void>;
    onClose?: (req: FastifyRequest, socket: WebSocket) => Promise<void>;
};

interface IMessageContentRule {
    type: "startsWith" | "contains" | "regex" | "in";
    content: string;
}
/**
 * agent的一条匹配规则，agent根据规则优先级找到匹配的第一个规则。
 * 规则可以给bot或者skill使用
 * 各个条件之间是且的关系
 *
 * 用于skill的规则，如果返回的时候删除data中的message对象，则会停止进一步使用bot响应。可以用实现如发送特定指令返回固定内容的功能。
 */
interface IMessageRule {
    /**
     * 响应的消息源实例的名称，不配置表示响应所有的消息源
     */
    /**
     * 消息源模板过滤。比如一个钉钉消息源模板可能有很多个实例，如果希望全部响应，直接配置消息源的名称即可，而不需要每一个实例都配置
     */
    /**
     * 响应的用户列表，不配置表示响应respond规则下，所有可以对话的用户
     *
     * 用户使用的是userName过滤，因为nickName重名的几率很大
     */
    fromUserNames?: string[];
    /**
     * 用户昵称的过滤
     */
    fromNickNames?: string[];
    /**
     * 群消息时，fromUserName的限制是否生效，默认false，即群里所有人都响应
     */
    checkUserInGroup?: boolean;
    /**
     * 用户群组的过滤规则，不配置表示不根据群组过滤（即都响应），针对nickName??userName??id的规则
     */
    groupNameRule?: IMessageContentRule;
    /**
     * 生效的消息类型，可多选，不配置表示不做类型检查（即检查通过）
     */
    messageTypes?: (SourceChatMessageType | "ALL")[];
    /**
     * 过滤规则，不配置表示不根据内容过滤，仅文本消息内容（TEXT和REF）的该过滤生效。
     *
     * 正向规则，匹配成功才会响应，不适合用来做内容审查
     */
    contentFilter?: IMessageContentRule;
    /**
     * 使用的实例名称。如果是针对skill的规则，就是skill实例的名称，如果是针对bot，就是bot实例的名称
     */
    instanceName: string;
    /**
     * 优先级，order值越小，优先级越高，默认100
     */
    order?: number;
    /**
     * 群组过滤模式，deny表示不响应群组消息。whitelist或者blacklist对应groupNames中的配置应该如何理解。
     * 不配置表示whitelist
     */
    groupMode?: "deny" | "whitelist" | "blacklist";
    /**
     * 用户过滤模式，all表示响应全部用户。whitelist或者blacklist对应fromUserNames中的配置该如何理解。
     * 不配置表示whitelist
     */
    userMode?: "all" | "whitelist" | "blacklist";
    /**
     * 对什么消息生效（仅技能的rule可配置）。all表示来源和响应都生效（前提是skill中也有对应方法），source表示只对来源生效，reply表示只对响应生效。默认all。
     */
    skillApplyOn?: "all" | "source" | "reply";
    /**
     * 技能应用与回复的状态，complete表示只有本次回复都结束后才应用，该情况一般用于需要完整获取回复的文本消息内容，part是每次回复都使用，如语音消息转文本。默认part。
     */
    skillWhenReplyStatus?: "complete" | "part";
    /**
     * 该配置仅对群聊生效
     * 只要有一个配置过的条件满足即可，不配置或者bool类型配置为false的不参与判断。
     *
     * 例如：
     * - 如果希望没有任何限制，留空即可。
     * - 如果希望仅仅被@的时候回复，配置为{at:true}
     * - 如果被@ 或者以某个字符开头的时候都回复，配置为{at:true,names:["允许的字符"]}
     * - 如果配置为{}或者{at:false},{names:[]},{refered:false}都表示不响应任何请求
     *
     * 注意：技能会在找到bot后调用，因此如果bot中配置了这个规则，技能如果也是一样的规则，则直接留空即可
     */
    respondTo?: {
        /**
         * 被@ 且在@ 列表中
         * 只对文本或者图文混排的生效。纯图片，声音等类型的，由bot决定是否响应这些类型。
         *
         * 不配置或者配置为false都表示忽略该配置
         */
        at?: boolean;
        /**
         * 文本以以下列表中的一个开头。不配置或者配置为空则忽略该条件（即只看别的条件）。
         */
        names?: string[];
        /**
         * 内容被引用也可以响应。不配置或者配置为false则忽略该条件（即只看别的条件）。
         */
        refered?: boolean;
    };
}

/**
 * 机器人的固有属性，如名称等，在机器人类型属性中配置
 */
interface IBotParams extends IConfigParams {
    /**
     * 是否需要框架提供历史消息，默认false。对于原生支持历史消息的后端，如dify，可以不需要平台进行历史消息存储
     * 或者没有实现历史功能的bot，也应该设置为false。
     */
    needHistoryMessage?: boolean;
    /**
     * 在一个用户的当前对话中是否允许有多个活跃的chat，默认false。，一般均不允许，agent会等待bot上一个回复完成再继续下一次对话
     */
    allowMultiActiveChat?: boolean;
}
/**
 * 机器人的实例属性，在创建机器人实例的时候配置
 */
interface IBotOptions extends IInstanceCreateOptions {
    /**
     * 并不是所有bot都支持自定义prompt，比如agent类的，一般都在agent平台上预置好，或者通过自定义变量传入
     */
    systemPrompt?: string;
}
interface IMessageContentReceiver {
    /**
     * 推理过程
     * @param text
     * @returns
     */
    onReasoning?: (text: string) => void;
    /**
     * 将后端的消息返回给前端。当完成时，如果支持历史消息，应该将此次消息的平台版本，即botMessage返回给agent
     * @param content
     * @param messageType
     * @param botMessage 此botMeesage为机器人的消息，类型应该为bot
     * @returns
     */
    onContent: (content: SourceChatContent, messageType: SourceChatMessageType) => void;
    onError: (error: string) => void;
}
interface IBotFileInfo {
    file: IAsyncFile;
    messageId: string;
    type: "image" | "file" | "video";
}
/**
 * 机器人特定平台最终发送和接收的消息，用于历史消息缓存
 */
interface IBotHistoryMessage {
    type: "bot" | "user";
    data: any;
}
interface IBotReadyMessage {
    forHistory?: IBotHistoryMessage;
    forSend: any;
    chatId: string;
    plainText: string;
}
/**
 * 一个被动接收消息并响应的机器人
 */
interface IBot extends IInstance {
    get options(): IBotOptions;
    get params(): IBotParams;
    /**
     * bot的初始化代码，支持预加载资源
     */
    init(): Promise<void>;
    /**
     * 仅仅对消息实现一个平台化的转换。
     * 如果涉及到图片或者文件的上传，应该在用户提问的时候，识别提问中是否存在引用消息（即针对文件图片的提问，必须使用引用消息实现），如果存在，在获取回复之前执行上传等异步动作，而不是一收到文件消息就上传
     * 该接口返回的IBotMessage的type应该都是user
     */
    prepareMessage(data: IAgentChatEventData): Promise<IBotReadyMessage>;
    /**
     * 单聊时，每次对方发来消息都会调用该方法获取回复
     * 群聊时，只有被@或者以指定名称开头呼叫时，才会被调用
     *
     * 该方法请务必等待回复完成后再异步返回。
     * @param data
     * @param receiver
     * @param forSend 由本bot在getBotMessage中返回的forSend的内容，正常应该直接使用此内容进行发送
     * @param historyBotMessages 当bot支持历史消息，且调用的agent开启了历史消息存储时会传入历史消息
     * @returns 返回本次回答的botMessage信息，以便存入历史消息
     */
    getResponse(data: IAgentChatEventData, receiver: IMessageContentReceiver, readyMessage: IBotReadyMessage, historyBotMessages?: IBotHistoryMessage[]): Promise<IBotHistoryMessage>;
    /**
     * 请求清除当前聊天对象的历史对话
     * @param data
     * @returns 如果有异常，返回异常说明。成功清除无需返回信息。
     */
    clearHistoryRequested(data: IAgentChatEventData): Promise<string>;
}
type BotCreator = (options: IBotOptions) => IBot;
/**
 * 机器人触发的消息的基础结构
 */
interface IBotEventData {
    sourceMessage: ISourceChatMessage;
}
/**
 * 当bot获得回复后，用来记录历史消息的事件。如果bot申明了历史消息，agent会监听该事件，并管理历史消息，在调用getMessage的时候传入历史消息
 */
interface IBotHistoryRecordEventData {
    userMessage: any;
    botMessage: any;
}

interface IHisotryMessageManagerOptions {
    /**
     * 过期时间。超过该时间的消息将被移除。默认300秒。
     */
    expireInSeconds?: number;
    /**
     * 最大缓存的字数。默认10240。如果一条记录就大于了这个数值，这条记录也不会被缓存。
     *
     * 仅对文字类消息使用
     */
    maxWordsCount?: number;
    /**
     * 最大缓存条数，默认30。
     */
    maxItemsCount?: number;
}
interface IBotCacheMessage {
    message: IBotHistoryMessage;
    wordsCount: number;
    expiresAt: number;
}
/**
 * 基于内存的历史消息管理
 */
declare class HistoryMessageManager {
    protected options: IHisotryMessageManagerOptions;
    static DefaultOptions: IHisotryMessageManagerOptions;
    constructor(options: IHisotryMessageManagerOptions);
    protected messages: IBotCacheMessage[];
    protected wordsCount: number;
    /**
     * 增加一条历史消息，如果是文本类型的，需要单独传入文本内容content，以便统计字数
     * @param message
     * @param content
     */
    addMessage(message: IBotHistoryMessage, content?: SourceChatContent): void;
    /**
     * 获取历史消息，获取的是内部的一个浅拷贝
     * @returns
     */
    getHistoryMessages(): IBotHistoryMessage[];
    clearHistory(): void;
}

interface IDisposable {
    dispose(): Promise<string>;
}

/**
 * agent的技能，可以用来做任何关于消息源或者bot回复的内容的操作，如改变文本回复为语音回复
 */
interface ISkill extends IInstance {
    get options(): ISkillOptions;
    get params(): ISkillParams;
    init(): Promise<void>;
    /**
     * 在消息被响应之前调用。无需响应的消息不会被调用
     * 如果希望拦截bot的后续响应，可以将data中的message设置为空
     * @param data
     */
    applyOnSource?(data: IAgentChatEventData): Promise<void>;
    /**
     * 在bot响应的消息被发出之前调用，可以基于bot的内容加工，返回新的内容和消息类型
     * @param content
     * @param messageType
     * @param sourceData
     * @param allContent 当回复类型是文本且回复全部完成时，会传入该参数，表示完整的回复内容
     */
    applyOnReply?(content: SourceChatContent, messageType: SourceChatMessageType, sourceData: IAgentChatEventData, allContent?: string): Promise<{
        content: SourceChatContent;
        messageType: SourceChatMessageType;
    }>;
}
interface ISkillOptions extends IInstanceCreateOptions {
    /**
     * 技能是否被禁用，禁用后将不可用。实例级别
     */
    disabled?: boolean;
}
declare const SkillSchemaBaseProperties: {
    disabled: {
        type: string;
        title: string;
        "x-decorator": string;
        "x-component": string;
        "x-decorator-props": {
            tooltip: string;
        };
    };
    instanceName: {
        type: string;
        title: string;
        "x-order": number;
        "x-decorator": string;
        "x-component": string;
        "x-component-props": {
            placeholder: string;
        };
        "x-decorator-props": {
            tooltip: string;
        };
    };
};
interface ISkillParams extends IConfigParams {
}
type SkillCreator = (options: ISkillOptions) => ISkill;

interface ITaskTriggerData {
    data: any;
    from: string;
}
/**
 * 任务触发器构建参数
 */
interface ITaskTriggerOptions extends IInstanceCreateOptions {
    /**
     * 任务被触发时的回调
     * @param data
     * @returns
     */
    onTask: (data: ITaskTriggerData) => void;
}
/**
 * 任务触发器的固定属性
 */
interface ITaskTriggerParams extends IConfigParams {
}
/**
 * 任务触发器。限定条件可以在触发器的options中配置
 * 通过实例管理器注册和构建，不缓存实例，每个任务创建新的实例
 */
interface ITaskTrigger extends IInstance, IDisposable {
    get options(): ITaskTriggerOptions;
    get params(): ITaskTriggerParams;
}
/**
 * 任务执行结果
 */
interface ITaskRunResult {
    /**
     * 执行过程中的记录或者结果，编码为字符串，方便存储
     */
    detail?: string;
    /**
     * 如果没有执行成功，error需要提供错误信息
     */
    error?: string;
    /**
     * 任务开始时间
     */
    startTime?: Date;
    /**
     * 任务结束时间
     */
    endTime?: Date;
}
/**
 * 一个任务执行器。前端基于任务执行器及其约束条件创建任务
 */
interface ITaskRunner extends IInstance {
    get options(): ITaskRunnerOptions;
    get params(): ITaskRunnerParams;
    /**
     * 任务执行接口。任务执行无需返回任何内容，任务需要异步执行。
     */
    run(data?: ITaskTriggerData): Promise<ITaskRunResult>;
}
declare const TaskRunnerSchemaBaseProperties: {
    disabled: {
        type: string;
        title: string;
        "x-decorator": string;
        "x-component": string;
        "x-decorator-props": {
            tooltip: string;
        };
        default: boolean;
        required: boolean;
    };
};
/**
 * 任务执行器的构建参数
 */
interface ITaskRunnerOptions extends IInstanceCreateOptions {
    disabled?: boolean;
}
/**
 * 任务执行器的固定属性
 */
interface ITaskRunnerParams extends IConfigParams {
    /**
     * 支持的触发器名称及其限制条件
     *
     * 如设置消息触发的时候，可以通过这里设置支持触发的消息类型，主要给前端选择进行约束
     */
    triggerConstraints?: {
        [name: string]: ITaskTriggerOptions | null;
    };
}
type TaskRunnerCreator = (options: ITaskRunnerOptions) => ITaskRunner;
type TaskTriggerCreator = (options: ITaskTriggerOptions) => ITaskTrigger;
declare abstract class TaskTrigger implements ITaskTrigger {
    protected app: PPAgent;
    protected _options: ITaskTriggerOptions;
    constructor(app: PPAgent, _options: ITaskTriggerOptions);
    abstract get options(): ITaskTriggerOptions;
    abstract get params(): ITaskTriggerParams;
    abstract dispose(): Promise<string>;
}
interface ITaskConfig {
    name: string;
    triggerName: string;
    triggerOptions: ITaskTriggerOptions;
    runnerName: string;
    runnerOptions: ITaskRunnerOptions;
}
interface ITaskServiceOptions {
    tasks?: ITaskConfig[];
    maxRecords?: number;
}
declare class TaskService implements IDisposable {
    private _app;
    private _options;
    constructor(_app: PPAgent, _options?: ITaskServiceOptions);
    private _initialized;
    private _taskTriggers;
    private _onlineCount;
    get onlineCount(): number;
    init(): Promise<void>;
    reload(): Promise<void>;
    private _loadTasks;
    dispose(): Promise<string>;
}

type Creator<OptionsType, InstanceType> = (options: OptionsType) => InstanceType;
interface IInstanceCreator<OptionsType, InstanceType, ParamsType> {
    creator: Creator<OptionsType, InstanceType>;
    params: ParamsType;
}
interface IOnlinePluginInfo extends IModelInfo {
    version: string;
    repo?: string;
    author?: string;
    homepage?: string;
    keywords?: string;
    options?: any;
    displayName?: string;
    schecma?: ISchema;
}
interface IPPAgentPluginHandler extends IDisposable {
    /**
     * 所有服务启动之前被调用。适合注册各类构建器，如消息源、技能、机器人。也可以注入自定义的路由，如果需要在实体注册和创建之后，http启动之前可以在beforeStart中实现。
     * @returns
     */
    init: () => Promise<{
        skills?: IInstanceCreator<ISkillOptions, ISkill, ISkillParams>[];
        bots?: IInstanceCreator<IBotOptions, IBot, IBotParams>[];
        sources?: IInstanceCreator<ISourceOptions, ISource, ISourceParamas>[];
        taskTriggers?: IInstanceCreator<ITaskTriggerOptions, ITaskTrigger, ITaskTriggerParams>[];
        taskRunners?: IInstanceCreator<ITaskRunnerOptions, ITaskRunner, ITaskRunnerParams>[];
    }>;
    /**
     * HTTP服务启动之前（agent和task创建之后）
     * @returns
     */
    beforeStart?: () => Promise<void>;
    /**
     * HTTP服务启动之后
     * @returns
     */
    afterStart?: () => Promise<void>;
    /**
     * 在服务被关闭之前被调用
     * @returns
     */
    beforeClose?: () => Promise<void>;
    /**
     * 是否必须使用在线配置的相关功能，如进行数据存储。
     */
    needOnline: boolean;
    /**
     * 插件名称，需要跟package.json中的完全一致
     */
    name: string;
    /**
     * 插件配置UI定义，如果不设置，则使用JSON编辑器编辑。
     */
    schema?: ISchema;
}
/**
 * 插件。在函数被调用的时候，如果有需要可以执行初始化操作
 *
 * 如果需要注册技能、消息源、机器人，请在beforeStart时
 */
type IPPAgentPlugin = (app: PPAgent, options?: Record<string, any>) => Promise<IPPAgentPluginHandler>;

interface IAgentModels {
    /**
     * agent列表
     */
    agents?: IAgentOptions[];
    /**
     * skill列表
     */
    skills?: {
        name: string;
        options: ISkillOptions;
    }[];
    /**
     * bot列表
     */
    bots?: {
        name: string;
        options: IBotOptions;
    }[];
    /**
     * 消息源列表
     */
    sources?: {
        name: string;
        options: ISourceOptions;
    }[];
}
interface IAgentServiceOptions {
    /**
     * 最大请求记录，与用户级别也相关。超过的配置将不被获取到
     */
    maxRecords?: number;
    models?: IAgentModels;
}
/**
 * 智能体服务。如果不连接在线配置，可以设置offline为true。
 */
declare class AgentService implements IDisposable {
    private _app;
    private _options;
    constructor(_app: PPAgent, _options?: IAgentServiceOptions);
    private _initialized;
    private _agents;
    private _tableNames;
    private _resourceCount;
    get resourceCount(): {
        agents: number;
        bots: number;
        sources: number;
        skills: number;
    };
    get agents(): Agent[];
    init(): Promise<void>;
    getAgentByName(name: string): Agent;
    /**
     * 停止当前所有的agent、bot、skill、source的活动，重新从数据库加载新的。
     */
    reload(): Promise<void>;
    private _loadConfig;
    private _loadTableConfig;
    private _loadInstances;
    private _loadSources;
    private _loadBots;
    private _loadSkills;
    private _loadAgents;
    dispose(): Promise<string>;
}

declare class SkillManager extends InstanceBaseManager<ISkill, SkillCreator, ISkillOptions, ISkillParams> {
}

declare class SourceManager extends InstanceBaseManager<ISource, SourceCreator, ISourceOptions, ISourceParamas> {
}

declare class BotManager extends InstanceBaseManager<IBot, BotCreator, IBotOptions, IBotParams> {
    runBot(instanceName: string, type: SourceChatMessageType, content: SourceChatContent, customData?: IAgentChatEventData, onStream?: (type: SourceChatMessageType, content: SourceChatContent) => void): Promise<{
        text: string;
        all?: {
            content: SourceChatContent;
            type: SourceChatMessageType;
        }[];
    }>;
}

declare class TaskRunnerManager extends InstanceBaseManager<ITaskRunner, TaskRunnerCreator, ITaskRunnerOptions, ITaskRunnerParams> {
    protected options?: IInstanceBaseMangerOptions;
    constructor(options?: IInstanceBaseMangerOptions);
}
declare class TaskTriggerManager extends InstanceBaseManager<ITaskTrigger, TaskTriggerCreator, ITaskTriggerOptions, ITaskTriggerParams> {
    protected options?: IInstanceBaseMangerOptions;
    constructor(options?: IInstanceBaseMangerOptions);
}

interface IGlobalNotifyEventData extends IGlobalEventData {
    info: {
        /**
         * 如果提供了callback url，那么客户端会详细消息操作按钮。当提供了schema和data时，按照可视化方式显示，否则显示一个文本输入框。用户编辑的JSON结果，将被POST到指定的路由下。
         *
         * 为http的绝对路径。
         */
        callbackUrl?: string;
        /**
         * 表单结构
         */
        schema?: ISchema;
        /**
         * 操作按钮的名称，默认是“详情”
         */
        detailActionName?: string;
        /**
         * 详情窗口中，确认按钮的名称，默认是“提交”
         */
        confirmActionName?: string;
        /**
         * 通知等级，important和urgent会高亮显示
         */
        level?: "normal" | "important" | "urgent";
        /**
         * 消息的有效期，如果不提供，则使用插件的全局有效期，全局有效期默认为1小时
         */
        expireInSeconds?: number;
    };
}
interface IGlobalEventData {
    /**
     * 消息名称
     */
    title: string;
    /**
     * 消息的描述
     */
    desc?: string;
    /**
     * 消息的时间
     */
    time?: Date;
    /**
     * 用来唯一标记一条消息。如果是支持与配置端进行callback的通知，在callback的时候需要根据这个id来识别当前是哪个消息的callback。
     */
    id?: string;
    /**
     * 消息的详细数据
     */
    data?: any;
}
declare enum GlobalEventNames {
    APP_STARTED = "APP_STARED",
    APP_RELOAD = "APP_REALOD",
    APP_RESTARTED = "APP_RESTARTED",
    APP_NOTIFY = "APP_NOTIFY"
}
declare class GlobalEvent extends Emittery<{
    [eventName: string]: IGlobalEventData;
}> {
    constructor(name: string);
    private _logger;
    private _eventNames;
    get eventNames(): string[];
    emit(eventName: string, eventData?: IGlobalEventData): Promise<void>;
    /**
     * 只有注册过的全局消息类型才会被外部通过接口获取到名称，未注册的也可正常触发消息
     */
    registerGlobalEventNames(name: string): void;
}

interface IPPAgentOptions {
    /**
     * agent服务的构建参数
     */
    agentServiceOptions?: IAgentServiceOptions;
    taskServiceOptions?: ITaskServiceOptions;
    /**
     * 是否是离线模式，离线模式不从网络加载配置
     */
    offline?: boolean;
    /**
     * 如果配置，那么应用可以在有需要的时候使用默认图
     */
    sharedLogoPath?: string;
    /**
     * 如果配置，那么应用可以在有需要的时候使用默认图
     */
    sharedCoverPath?: string;
    /**
     * id，请使用英文
     */
    name: string;
}
declare class PPAgent extends Emittery {
    private _options;
    static EventNames: {
        ERROR: string;
    };
    constructor(_options?: IPPAgentOptions);
    private _server;
    private _pluginHandlers;
    private _wsRoutes;
    private _httpRoutes;
    private _starting;
    private _stopping;
    private _stopped;
    private _running;
    private _agentService;
    private _skillManager;
    private _sourceManager;
    private _botManager;
    private _taskService;
    private _taskTriggerManager;
    private _taskRunnerManager;
    private _xmlParser;
    private _sharedCover;
    private _sharedLogo;
    private _client;
    private _me;
    private _globalEvent;
    private _logger;
    private _onlinePluginInfos;
    private _services;
    get server(): FastifyInstance<fastify.RawServerDefault, http.IncomingMessage, http.ServerResponse<http.IncomingMessage>, fastify.FastifyBaseLogger, fastify.FastifyTypeProviderDefault>;
    get skillManager(): SkillManager;
    get sourceManager(): SourceManager;
    get botManager(): BotManager;
    get taskTriggerManager(): TaskTriggerManager;
    get taskRunnerManager(): TaskRunnerManager;
    get agentService(): AgentService;
    get offlineMode(): boolean;
    get sharedCover(): IAsyncFile;
    get sharedLogo(): IAsyncFile;
    get client(): AuthenticationClient<any> & RestClient<any>;
    get options(): IPPAgentOptions;
    get taskService(): TaskService;
    get globalEvent(): GlobalEvent;
    get plugins(): IPPAgentPluginHandler[];
    get me(): {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        password: string | null;
        location: string | null;
        title: string | null;
        description: string | null;
        tags: string[] | null;
        avatar: string | {
            id: string;
            storage: string;
            filename_disk: string | null;
            filename_download: string;
            title: string | null;
            type: string | null;
            folder: string | {
                id: string;
                name: string;
                parent: string | /*elided*/ any;
            };
            uploaded_by: string | /*elided*/ any;
            uploaded_on: "datetime";
            modified_by: string | /*elided*/ any;
            modified_on: "datetime";
            charset: string | null;
            filesize: string | null;
            width: number | null;
            height: number | null;
            duration: number | null;
            embed: unknown | null;
            description: string | null;
            location: string | null;
            tags: string[] | null;
            metadata: Record<string, any> | null;
            focal_point_x: number | null;
            focal_point_y: number | null;
        };
        language: string | null;
        theme: string | null;
        tfa_secret: string | null;
        status: string;
        role: string | {
            id: string;
            name: string;
            icon: string;
            description: string | null;
            parent: string | /*elided*/ any;
            children: string[] | /*elided*/ any[];
            policies: string[] | {
                id: string;
                role: string | /*elided*/ any;
                user: string | /*elided*/ any;
                policy: string | {
                    id: string;
                    name: string;
                    icon: string;
                    description: string | null;
                    ip_access: string | null;
                    enforce_tfa: boolean;
                    admin_access: boolean;
                    app_access: boolean;
                    permissions: number[] | {
                        id: number;
                        policy: string | /*elided*/ any;
                        collection: string;
                        action: string;
                        permissions: Record<string, any> | null;
                        validation: Record<string, any> | null;
                        presets: Record<string, any> | null;
                        fields: string[] | null;
                    }[];
                    users: string[] | /*elided*/ any[];
                    roles: string[] | /*elided*/ any[];
                };
                sort: number;
            }[];
            users: string[] | /*elided*/ any[];
        };
        token: string | null;
        last_access: "datetime" | null;
        last_page: string | null;
        provider: string;
        external_identifier: string | null;
        auth_data: Record<string, any> | null;
        email_notifications: boolean | null;
        appearance: string | null;
        theme_dark: string | null;
        theme_light: string | null;
        theme_light_overrides: Record<string, unknown> | null;
        theme_dark_overrides: Record<string, unknown> | null;
        policies: string[] | {
            id: string;
            name: string;
            icon: string;
            description: string | null;
            ip_access: string | null;
            enforce_tfa: boolean;
            admin_access: boolean;
            app_access: boolean;
            permissions: number[] | {
                id: number;
                policy: string | /*elided*/ any;
                collection: string;
                action: string;
                permissions: Record<string, any> | null;
                validation: Record<string, any> | null;
                presets: Record<string, any> | null;
                fields: string[] | null;
            }[];
            users: string[] | /*elided*/ any[];
            roles: string[] | {
                id: string;
                name: string;
                icon: string;
                description: string | null;
                parent: string | /*elided*/ any;
                children: string[] | /*elided*/ any[];
                policies: string[] | {
                    id: string;
                    role: string | /*elided*/ any;
                    user: string | /*elided*/ any;
                    policy: string | /*elided*/ any;
                    sort: number;
                }[];
                users: string[] | /*elided*/ any[];
            }[];
        }[];
    };
    get onlinePlugins(): MapIterator<IOnlinePluginInfo>;
    get running(): boolean;
    get services(): Map<string, any>;
    private _createServer;
    private _initServer;
    private _checkRegister;
    private _initResources;
    private _loadOnlinePlugins;
    /**
     * 请在start之前调用
     * @param plugin
     * @returns
     */
    use(plugin: IPPAgentPlugin, info?: IOnlinePluginInfo): Promise<IPPAgentPluginHandler>;
    start(): Promise<void>;
    reload(): Promise<void>;
    stop(signal?: string): Promise<void>;
    /**
     * API路由动态注册。由框架统一注册，source类只需要按接口要求返回相应路由信息。
     * - 如果使用文本进行交互，type可以设置为normal，这样只要handler直接返回相应的文本即可。
     * - 如果需要完全自己控制返回内容，如二进制等，可以设置为custom，需要自行调用reply中的send方法返回内容。
     * - 如果遇到异常将在外层被捕获后，根据异常类型进行返回。
     *
     * 由于不同的外部请求认证方式不一（如不同来源的回调），因此有需要实现认证的时候，需要action自行实现
     * @param instanceName 消息源实例的key
     * @param actionName 处理器名称
     * @param action 处理器
     */
    registerRoutes(instanceName: string, info: ISourceActionInfo): void;
    /**
     * WS处理器注册。由框架统一注册，source类只需要按接口要求返回相应处理行器信息。
     * 如果使用JSON进行交互，建议客户端连接的时候直接连接ws/normal端点，然后使用标准的ISourceWSNormalInMessage格式传入数据，此时handler只要处理好数据返回纯数据即可，框架会包裹为ISourceWSNormalOutMessage返回给客户端。如果不需要返回数据，返回void即可。
     * 如果希望完全自定义，可以让客户端连接到ws/instanceName/action端点，此时所有消息将原封不动的传给handler进行处理，handler可以返回处理好的内容由框架发送，或者自行调用socket.send进行发送，自行发送时，处理方法返回void即可。
     *
     * 由于不同的外部请求认证方式不一（如不同来源的回调），因此有需要实现认证的时候，需要action自行实现
     * @param instanceName 消息源实例的key
     * @param actionName 处理器的名称
     * @param action 处理器
     */
    registerWSHandler(instanceName: string, info: ISourceActionInfo): void;
}

type AgentChatMessageReplyType = (content: SourceChatContent, messageType: SourceChatMessageType, custom?: Partial<ISourceChatMessage>, now?: boolean) => Promise<string>;
/**
 * 由agent发布的聊天消息事件，带了快速回复方法
 */
interface IAgentChatEventData extends ISourceChatMessageEventData {
    /**
     * 快捷回复。完全自定义的发送可以直接调用agent的发送方法。
     * 默认文本类型，其他类型传入第二个参数
     */
    reply: AgentChatMessageReplyType;
}
interface IAgentOptions {
    botResponseRule: IMessageRule;
    sourceInstanceNames: string[];
    /**
     * 是否从文本消息中提取图片单独发送。钉钉这类支持混编的建议使用混编的类型发送，而不是提取后单独发送。
     */
    splitImageFromBotText?: boolean;
    /**
     * 图片拆出来之后是否需要从原来的文字中移除
     */
    removeImageAfterSplit?: boolean;
    /**
     * 是否检测音频wav，默认是
     */
    checkWavAudio?: boolean;
    /**
     * agent实例的名称
     */
    instanceName: string;
    /**
     * 当不支持流式传输时，系统会尽快把后段返回的内容发送回去。通过设置单词最小数量，可以避免连续发送过多条数据。
     * 默认70个字符。实际返回数量不一定刚好等于该数。该特性仅对中文生效。
     *
     * 如果希望等待后端回答完成后一次性发送，可以设置为负值。
     *
     * 建议在支持流式模式的source下，设置较小，比如10-20
     *
     * 小于0表示最后全部输出完成一起回复
     */
    bufferWordsMinCount?: number;
    /**
     * 一次回复最多被拆分成多少条，如果超过了，则最后一次性回复。避免被拆分的太零散，也能符合部分平台对回复数量的要求。
     *
     * 默认3。建议在支持流式的source下，设置尽可能的大，避免造成最后一起回复。
     */
    maxSplitCount?: number;
    /**
     * 用于拆分句子的标记，默认["！","。","？"]
     *
     * 如果设置为["none"]，则表示只关注字数，不考虑分句，适用于流式回复。非流式回复请务必设置合理值或者不做设置，否则异常的断句可能导致图片无法被识别或者错误识别
     */
    splitCharacters?: string[];
    /**
     * 是否激活历史消息。需要机器的实现类也支持历史消息，即触发历史消息事件，并在发送到后端时带上历史消息
     */
    historyEnabled?: boolean;
    /**
     * 历史消息管理的构建参数
     */
    historyOptions?: IHisotryMessageManagerOptions;
    /**
     * 仅sendMode为queue时生效。最小发送时间间隔，单位是毫秒。防止发送过快被识别为垃圾消息。默认为1000。
     * source的流式模式下，建议设置的较小
     */
    minSendInterval?: number;
    /**
     * 发送模式，now是所有消息都默认立即发送，interval是加入发送队列，隔一段时间发送一条，避免认为乱发。发送间隔可以通过minSendInterval配置。
     * 如果立即发送，有可能造成发送顺序与bot返回的不一致（下载和传输耗时导致）
     * 默认队列发送。
     */
    sendMode?: "now" | "queue";
    /**
     * 技能规则列表
     */
    skillRules?: IMessageRule[];
    /**
     * 兜底回复。当没有匹配到规则，但是bot无法回复的时候触发该回复。如果不设置，则不回复。如果消息被技能取消回复，不会触发该回复。
     */
    fallbackAnswer?: string;
    /**
     * 表示如果一个用户同时在一个bot还没有回答结束时又提问，且bot不支持一个会话中多个活跃对话时，输出的提示词。
     *
     * 当multiActiveChatInConversationMode配置为发送提示时才会生效。
     */
    multiActiveChatInConversationTips?: string;
    /**
     * 如果一个用户同时在一个bot还没有回答结束时又提问，且bot不支持一个会话中多个活跃对话时，要采取的措施，pool是直接放入等待区，不提示；tips是给出提示，不放入等待区；pool_tips是放入等待区且给出提示。
     *
     * 提示内容可以通过multiActiveChatInConversationTips进行配置。
     *
     * 默认为pool。
     */
    multiActiveChatInConversationMode?: "pool" | "tips" | "pool_tips";
    /**
     * 是否发送消息处理异常的日志到客户端，默认false
     */
    sendErrorLog?: boolean;
    /**
     * 正在执行中的问答，执行的超时时间，默认60秒。超过的任务将不再等待，继续执行一个提问（不会被取消回调，有返回后仍然会发送）。
     */
    timeoutInSeconds?: number;
    /**
     * 思考过程最大的拆分数量，默认为3。如果超过了，则最后一次性回复。避免被拆分的太零散，也能符合部分平台对回复数量的要求。
     */
    maxReasoningSplitCount?: number;
    /**
     * 是否显示思考过程（仅对推理模型有效）
     */
    sendReasoning?: boolean;
    /**
     * 思考部分内容的前缀，如 【思考中】
     */
    reasoningPrefix?: string;
    /**
     * 回复内容的前缀，如 【回复】。仅对推理模型生效。正常对内容的修改可以通过添加技能完成
     */
    contentPrefix?: string;
}
/**
 * 一个智能体，用于连接source和bot。
 * 各自职责如下：
 * - source：负责收消息、发消息、提供外部消息服务的接口能力
 * - bot：负责判断是否有能力响应某种消息、构建后端工具所需的消息体、发送消息给后端并回调给agent
 * - agent：负责监听source的消息、判断是否应该响应、找到bot获取响应、调用技能、回传响应结果给source
 */
declare class Agent extends Emittery implements IDisposable {
    protected app: PPAgent;
    protected _options: IAgentOptions;
    static params: IConfigParams;
    constructor(app: PPAgent, _options: IAgentOptions);
    private _initialized;
    private _logger;
    /**
     * 一个agent只匹配一个规则，如果需要针对不同的群或者对象设置不同的bot，可以建立多个agent
     */
    private _responseRule;
    private _skillRules;
    private _textEndId;
    private _historyManagers;
    private _sendMessagePool;
    private _sourceMessagePool;
    get options(): IAgentOptions;
    get name(): string;
    /**
     * 发送消息到指定的消息源
     * @param message 要发送的消息
     * @param to 要发送的消息源
     * @param now 是否立即发送，如果否，则根据配置确定是否加入发送队列
     * @param fromMessage 该消息的前置消息。如果source端只能被动回复消息，可能在发送的时候需要提供来源消息。
     * @returns
     */
    sendMessage(message: ISourceChatMessage, to: ISource, now?: boolean, fromMessage?: ISourceChatMessage): Promise<string>;
    dispose(): Promise<string>;
    protected processChatMessage: (sourceData: ISourceChatMessageEventData) => Promise<void>;
    protected onChatMessage: (data: IAgentChatEventData) => Promise<void>;
    protected onSelfChatMessage: (data: ISourceChatMessageEventData) => void;
    private _applyAfterSkills;
    private _applyBeforeSkills;
    private _nextQuestion;
    private _findRules;
    private _getBotMessageManager;
    private _wrapEventWithChatReply;
    private _sendFromPool;
    private _splitWords;
    private _initAgent;
}

interface ILogger {
    trace(message: any): void;
    debug(message: any): void;
    info(message: any): void;
    warn(message: any): void;
    error(message: any): void;
    fatal(message: any): void;
    emitter?: LogEmitter;
}
interface ILoggerEmitContent {
    level: Level;
    name: string;
    message: string;
}
/**
 * 日志转发器，仅转发框架内部日志
 * 默认级别为环境变量的级别
 */
declare class LogEmitter extends Emittery {
    private _levelMap;
    private _currentLevelVal;
    private _currentLevel;
    get level(): pino.Level;
    constructor(level?: Level);
    setLevel(level: Level): void;
    emitString(level: Level, name: string, message: string): void;
    emitObject(level: Level, name: string, message: any): void;
}
declare const getLogger: (name: string, needEmitter?: boolean) => ILogger;

interface IBasicBotOptions extends IBotOptions {
    /**
     * service url
     */
    apiBase?: string;
    /**
     * service key
     */
    apiKey: string;
    /**
     * 如果大于0，表示上一次的消息距离现在如果超过了多长时间就清空历史对话重新开始新的对话。默认30分钟。注意dify本身也有会话周期逻辑。这里的逻辑是在dify内增加主动清空逻辑。
     */
    historyExipresInSeconds?: number;
    /**
     * 附件何时上传，now是立即上传，later是用户下次提问的时候上传。立即上传bot会进行响应（私聊或者群聊agent配置非文本消息reply时），later不会马上响应，等提问后再响应。
     * later模式下，如果用户提问之前服务重启，那么缓存会丢失。
     * 默认later
     */
    attachSendMode?: "now" | "later";
    /**
     * 默认3张，同dify设置
     */
    maxAttachCount?: number;
    /**
     * 当收到订阅消息时，要对用户说的欢迎词，如果欢迎词以双下划线__开头，表示使用固定词语，如 __欢迎关注！，否则将使用配置的词作为提示词让后端给出欢迎词
     *
     * 可以使用该功能提供对模型能力的介绍。
     *
     * 默认为 “请对用户的使用表示欢迎，并且简单的介绍你自己，重点是你的能力。”
     */
    subscribeWelcome?: string;
    /**
     * 是否是纯文本模型，默认false，表示支持多模态。
     */
    onlyText?: boolean;
}
interface ILastBotMessageInfo {
    timeInSeconds: number;
    conversationId: string;
}
declare abstract class BasicBot extends Emittery implements IBot {
    protected _options: IBasicBotOptions;
    static params: IBotParams;
    constructor(_options: IBasicBotOptions);
    abstract get params(): IBotParams;
    abstract init(): Promise<void>;
    /**
     * 是否支持线上存储会话信息，默认false。dify和fastgpt这类是支持的，需要设置为true
     *
     * 即采用本系统再带的历史会话的，设置为false，使用后端线上会话的，设置为true
     */
    abstract get supportConversationOnline(): boolean;
    protected commandText: {
        attach: string;
        position: string;
        article: string;
        subscribe: string;
    };
    /**
     *  只有后端原生支持会话管理的，才需要缓存会话信息
     *  使用本系统自带历史信息的时候不需要管理该对象
     */
    protected chatIdCache: Keyv<ILastBotMessageInfo>;
    protected chatAttachCache: {
        [key: string]: IBotFileInfo[];
    };
    protected logger: ILogger;
    get options(): IBasicBotOptions;
    /**
     * 根据文本内容和文件信息生成请求体
     * @param text
     * @param files
     */
    protected abstract generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[], evt: IAgentChatEventData): Promise<IBotReadyMessage>;
    /**
     * 获取当前用户上一次聊天的会话ID
     */
    protected abstract getLatestConversationId(chatId: string): Promise<string>;
    /**
     * 获取当前用户上一次聊天的时间，单位是秒
     */
    protected abstract getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected abstract deleteConversation(conversationId: string, chatId: string): Promise<any>;
    protected checkCommand(text: string, chatId: string, data: IAgentChatEventData): boolean;
    protected getLastInfo(chatId: string): Promise<ILastBotMessageInfo>;
    protected abstract sendMessageBody(body: any, historyMessages: any[], cb: {
        onReasoning?: (text: string) => void;
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }, lastInfo?: ILastBotMessageInfo, evt?: IAgentChatEventData): Promise<IBotHistoryMessage>;
    clearHistoryRequested(data: IAgentChatEventData): Promise<string>;
    prepareMessage(data: IAgentChatEventData): Promise<IBotReadyMessage>;
    getResponse(data: IAgentChatEventData, receiver: IMessageContentReceiver, readyMessage: IBotReadyMessage, historyBotMessages?: IBotHistoryMessage[]): Promise<IBotHistoryMessage>;
}

interface ICozeBotOptions extends IBasicBotOptions {
    appId: string;
    privateKey: string;
    botId: string;
    customVars?: Record<string, string>;
    /**
     * 是否优先使用本地文件，而不是将文件上传到dify服务器，默认false
     * 如果优先使用本地文件，某些平台可能无法后续进行追问
     */
    preferLocalAttach?: boolean;
}
declare class CozeBot extends BasicBot {
    protected _options: ICozeBotOptions;
    static params: IBotParams;
    constructor(_options: ICozeBotOptions);
    private _service;
    init(): Promise<void>;
    get options(): ICozeBotOptions;
    get params(): IBotParams;
    get supportConversationOnline(): boolean;
    private _loadFileInfo;
    protected generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[]): Promise<IBotReadyMessage>;
    protected getLatestChatTime(): Promise<number>;
    protected getLatestConversationId(): Promise<string>;
    protected deleteConversation(): Promise<any>;
    protected sendMessageBody(body: StreamChatReq, historyMessages: any[], cb: {
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }, lastInfo?: ILastBotMessageInfo): Promise<IBotHistoryMessage>;
}

interface ICozeServiceOptions {
    privateKeyPath: string;
    publicKey: string;
    appId: string;
    /**
     * 默认https://api.coze.cn
     */
    apiBase?: string;
}
declare class CozeService {
    private _options;
    constructor(_options: ICozeServiceOptions);
    private _token;
    private _client;
    get client(): CozeAPI;
    private _loadToken;
    init(): Promise<void>;
    conversations(botId: string): Promise<unknown>;
    createConversation(messages?: any, metaData?: Map<string, any>): Promise<unknown>;
    streamChat(req: StreamChatReq, cb: {
        onStart?: (data: CreateChatData) => void;
        onReply: (content: string, data: StreamChatData) => void;
        onReplyCompleted?: (all: string, data: StreamChatData) => void;
        onCompleted?: (all: string, data: CreateChatData) => void;
        others?: (data: StreamChatData) => void;
    }): Promise<void>;
    private _post;
    private _get;
}

interface IDifyFileInfo {
    type: "image";
    transfer_method: "remote_url" | "local_file";
    /**
     * 传输模式为remote_url时需要传入
     */
    url?: string;
    /**
     * 传输模式为local_file时，填入返回的id
     */
    upload_file_id?: string;
}
interface IDifyChatMessageBody {
    query: string;
    /**
     * 用户输入变量，如果没有，请传入{}
     */
    inputs: {
        [key: string]: any;
    };
    response_mode?: "streaming" | "blocking";
    /**
     * 会话id，如果希望有历史消息功能，应该使用合适的规则来生成对话id
     * 如个人聊天以消息源+对方id，群组以消息源+群组id
     * 如果传入undefined，则每次对话都是新的对话
     */
    conversation_id?: string;
    parent_message_id?: string;
    /**
     * 聊天附件
     */
    files?: IDifyFileInfo[];
    /**
     * 是否自动生成标题，默认true
     */
    auto_generate_name?: boolean;
    user: string;
}

interface IDifyAgentBotOptions extends IBasicBotOptions {
    /**
     * 是否优先使用本地文件，而不是将文件上传到dify服务器，默认false
     * 如果优先使用本地文件，某些平台可能无法后续进行追问
     */
    preferLocalAttach?: boolean;
    /**
     * 自定义变量
     */
    customVars?: {
        [key: string]: any;
    };
}
declare class DifyAgentBot extends BasicBot {
    protected _options: IDifyAgentBotOptions;
    static params: IBotParams;
    constructor(_options: IDifyAgentBotOptions);
    private _service;
    get params(): IBotParams;
    get options(): IDifyAgentBotOptions;
    get supportConversationOnline(): boolean;
    private _uploadImage;
    private _loadFileInfo;
    init(): Promise<void>;
    protected generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[]): Promise<IBotReadyMessage>;
    protected getLatestConversationId(chatId: string): Promise<string>;
    protected getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected deleteConversation(conversationId: string, chatId: string): Promise<any>;
    protected sendMessageBody(body: IDifyChatMessageBody, historyMessages: any[], cb: {
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }, lastInfo?: ILastBotMessageInfo): Promise<IBotHistoryMessage>;
}

interface IOpenAIBotOptions extends IBasicBotOptions {
    clientOptions?: Omit<ClientOptions, "baseURL" | "apiKey">;
    chatOptions: Omit<OpenAI.ChatCompletionCreateParamsStreaming, "messages" | "stream" | "audio">;
}
declare class OpenAIBot extends BasicBot {
    protected _options: IOpenAIBotOptions;
    static params: IBotParams;
    constructor(_options: IOpenAIBotOptions);
    protected client: OpenAI;
    get options(): IOpenAIBotOptions;
    get params(): IBotParams;
    get supportConversationOnline(): boolean;
    private _loadFileInfo;
    protected generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[]): Promise<IBotReadyMessage>;
    protected getLatestConversationId(chatId: string): Promise<string>;
    protected getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected deleteConversation(conversationId: string, chatId: string): Promise<any>;
    protected sendMessageBody(body: OpenAI.ChatCompletionCreateParamsStreaming, historyMessages: any[], cb: {
        onReasoning?: (text: string) => void;
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        /**
         * 支持线上后端会话的才要调用，主要用于更新本次会话对应的时间
         * @param conversationId
         * @param timeInSeconds
         * @returns
         */
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }): Promise<IBotHistoryMessage>;
    init(): Promise<void>;
}

interface IFastGPTBotOptions extends IOpenAIBotOptions {
    /**
     * 是否使用在线的历史记录功能，关闭后每次都会创建新的会话。默认false，表示开启历史记录。
     */
    disableHistory?: boolean;
    chatOptions: Omit<OpenAI.ChatCompletionCreateParamsStreaming, "messages" | "stream" | "audio"> & {
        variables?: {
            [key: string]: any;
        };
    };
    /**
     * 应用的ID
     */
    appId: string;
}
declare class FastGPTBot extends OpenAIBot {
    protected _options: IFastGPTBotOptions;
    static params: IBotParams;
    constructor(_options: IFastGPTBotOptions);
    private _commonApiBase;
    get options(): IFastGPTBotOptions;
    get supportConversationOnline(): boolean;
    protected generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[]): Promise<IBotReadyMessage>;
    protected getLatestConversationId(chatId: string): Promise<string>;
    protected getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected deleteConversation(conversationId: string, chatId: string): Promise<any>;
}

interface IOllamaBotOptions extends IBasicBotOptions {
    /**
     * 模型名称
     */
    model: string;
    /**
     * Ollama的可选配置
     */
    options?: {
        [key: string]: any;
    };
    /**
     * 模型在GPU中驻留多久，默认为空
     */
    keep_alive?: number;
    authType: "basic" | "token" | "none";
    basicOptions?: {
        name: string;
        password: string;
    };
    tokenOptions?: {
        key: string;
        token: string;
        in: "header" | "query";
    };
}
declare class OllamaBot extends BasicBot {
    protected _options: IOllamaBotOptions;
    static params: IBotParams;
    constructor(_options: IOllamaBotOptions);
    get options(): IOllamaBotOptions;
    get params(): IBotParams;
    get supportConversationOnline(): boolean;
    protected generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[]): Promise<IBotReadyMessage>;
    protected getLatestConversationId(chatId: string): Promise<string>;
    protected getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected deleteConversation(conversationId: string, chatId: string): Promise<any>;
    protected sendMessageBody(body: any, historyMessages: any[], cb: {
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        /**
         * 支持线上后端会话的才要调用，主要用于更新本次会话对应的时间
         * @param conversationId
         * @param timeInSeconds
         * @returns
         */
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }): Promise<IBotHistoryMessage>;
    init(): Promise<void>;
}

declare class OpenRouterBot extends OpenAIBot {
    static params: IBotParams;
    constructor(options: IOpenAIBotOptions);
}

interface IQAnythingBotOptions extends IBasicBotOptions {
    botId: string;
}
declare class QAnythingBot extends BasicBot {
    protected _options: IQAnythingBotOptions;
    static params: IBotParams;
    constructor(_options: IQAnythingBotOptions);
    get options(): IQAnythingBotOptions;
    get params(): IBotParams;
    get supportConversationOnline(): boolean;
    protected generateReadyMessage(chatId: string, text: string): Promise<IBotReadyMessage>;
    protected getLatestConversationId(chatId: string): Promise<string>;
    protected getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected deleteConversation(conversationId: string, chatId: string): Promise<any>;
    protected sendMessageBody(body: any, historyMessages: any[], cb: {
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        /**
         * 支持线上后端会话的才要调用，主要用于更新本次会话对应的时间
         * @param conversationId
         * @param timeInSeconds
         * @returns
         */
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }): Promise<IBotHistoryMessage>;
    init(): Promise<void>;
}

interface IWenxinAgentBotOptions extends IBasicBotOptions {
    appId: string;
}
declare class WenxinAgentBot extends BasicBot {
    protected _options: IWenxinAgentBotOptions;
    static params: IBotParams;
    constructor(_options: IWenxinAgentBotOptions);
    get options(): IWenxinAgentBotOptions;
    get params(): IBotParams;
    get supportConversationOnline(): boolean;
    private _loadFileInfo;
    protected generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[]): Promise<IBotReadyMessage>;
    protected getLatestConversationId(chatId: string): Promise<string>;
    protected getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected deleteConversation(conversationId: string, chatId: string): Promise<any>;
    protected sendMessageBody(body: any, historyMessages: any[], cb: {
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        /**
         * 支持线上后端会话的才要调用，主要用于更新本次会话对应的时间
         * @param conversationId
         * @param timeInSeconds
         * @returns
         */
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }, lastInfo?: ILastBotMessageInfo): Promise<IBotHistoryMessage>;
    init(): Promise<void>;
}

interface IYuanQiBotOptions extends IBasicBotOptions {
    appId: string;
}
declare class YuanQiBot extends BasicBot {
    protected _options: IYuanQiBotOptions;
    static params: IBotParams;
    constructor(_options: IYuanQiBotOptions);
    get options(): IYuanQiBotOptions;
    get params(): IBotParams;
    get supportConversationOnline(): boolean;
    private _loadFileInfo;
    protected generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[]): Promise<IBotReadyMessage>;
    protected getLatestConversationId(chatId: string): Promise<string>;
    protected getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected deleteConversation(conversationId: string, chatId: string): Promise<any>;
    protected sendMessageBody(body: any, historyMessages: any[], cb: {
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        /**
         * 支持线上后端会话的才要调用，主要用于更新本次会话对应的时间
         * @param conversationId
         * @param timeInSeconds
         * @returns
         */
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }): Promise<IBotHistoryMessage>;
    init(): Promise<void>;
}

interface IZhipuQingyanBotOptions extends IBasicBotOptions {
    assistantId: string;
    metaData?: {
        [key: string]: string;
    };
    apiSecret: string;
}
declare class ZhipuQingyanBot extends BasicBot {
    protected _options: IZhipuQingyanBotOptions;
    static params: IBotParams;
    constructor(_options: IZhipuQingyanBotOptions);
    private _token;
    get options(): IZhipuQingyanBotOptions;
    get params(): IBotParams;
    get supportConversationOnline(): boolean;
    private _loadToken;
    private _loadFileInfo;
    protected generateReadyMessage(chatId: string, text: string, files: IBotFileInfo[]): Promise<IBotReadyMessage>;
    protected getLatestConversationId(chatId: string): Promise<string>;
    protected getLatestChatTime(conversationId: string, chatId: string): Promise<number>;
    protected deleteConversation(conversationId: string, chatId: string): Promise<any>;
    protected sendMessageBody(body: any, historyMessages: any[], cb: {
        onContent: (content: any, messageType: SourceChatMessageType) => void;
        onError: (error: any) => void;
        /**
         * 支持线上后端会话的才要调用，主要用于更新本次会话对应的时间
         * @param conversationId
         * @param timeInSeconds
         * @returns
         */
        onCompleted: (conversationId: string, timeInSeconds: number) => void;
    }, lastInfo?: ILastBotMessageInfo): Promise<IBotHistoryMessage>;
    init(): Promise<void>;
}

declare class SiliconFlowBot extends OpenAIBot {
    static params: IBotParams;
    constructor(options: IOpenAIBotOptions);
}

interface IXunfeiBotOptions extends IOpenAIBotOptions {
    /**
     * 优先级高于chatOptions中的模型名称
     */
    modelName?: string;
}
declare class XunfeiBot extends OpenAIBot {
    static params: IBotParams;
    constructor(options: IXunfeiBotOptions);
}

interface IZhipuBotOptions extends IOpenAIBotOptions {
    /**
     * 优先级高于chatOptions中的模型名称
     */
    modelName?: string;
}
declare class ZhipuBot extends OpenAIBot {
    static params: IBotParams;
    constructor(options: IZhipuBotOptions);
}

interface IPPAgentPluginOptions {
    /**
     * 通知有效期，过期的会被删除，客户端将看不到。
     *
     * 默认为1小时，即3600秒。最长不超过7天。
     *
     * 如果消息内指定了单独的有效期，以消息内的为准。
     */
    expiresInSeconds?: number;
    /**
     * 每隔多久检查一次消息的过期情况，默认是20秒。
     */
    checkNotifyFequencySeconds?: number;
    /**
     * 最大留存通知条数，超过后新的将覆盖旧的，默认100条。最少5条。
     */
    maxNotifyCount?: number;
}
declare const apiPlugin: IPPAgentPlugin;

declare const defaultPlugin: IPPAgentPlugin;

interface IBaseSTTSkillOptions extends ISkillOptions {
    /**
     * 是否确保音频格式为百度支持的wav格式。默认true，如果已经对接的渠道确保了是16k或者8k单声道音频，则无需检查。
     */
    ensureAudioFormat?: boolean;
}
/**
 * 对https://github.com/HG-ha/SenseVoice-Api的技能封装
 */
declare abstract class BaseSTTSkill implements ISkill {
    protected _options: IBaseSTTSkillOptions;
    static params: ISkillParams;
    constructor(_options: IBaseSTTSkillOptions);
    protected _logger: ILogger;
    protected _targetFormat: string;
    get options(): IBaseSTTSkillOptions;
    get params(): ISkillParams;
    init(): Promise<void>;
    protected abstract _getText(file: IAsyncFile): Promise<string>;
    protected _transpileContent(originContent: SourceChatContent): Promise<void>;
    applyOnSource(data: IAgentChatEventData): Promise<void>;
    applyOnReply(content: SourceChatContent, messageType: SourceChatMessageType): Promise<{
        content: SourceChatContent;
        messageType: SourceChatMessageType;
    }>;
}

interface ISenseVoiceSTTSkillOptions extends IBaseSTTSkillOptions {
    /**
     * 如xxx.com，无需带extract_text
     */
    apiHost: string;
    authType?: "basic" | "jwt" | "none";
    /**
     * jwt认证的时候需要提供
     */
    jwt?: string;
    /**
     * basic认证的时候需要提供
     */
    userName?: string;
    /**
     * basic认证的时候需要提供
     */
    password?: string;
}
/**
 * 对https://github.com/HG-ha/SenseVoice-Api的技能封装
 */
declare class SenseVoiceSTTSkill extends BaseSTTSkill {
    protected _options: ISenseVoiceSTTSkillOptions;
    static params: ISkillParams;
    constructor(_options: ISenseVoiceSTTSkillOptions);
    private _headers;
    get options(): ISenseVoiceSTTSkillOptions;
    get params(): ISkillParams;
    protected _getText(file: IAsyncFile): Promise<string>;
}

interface IBaseTTSSkillOptions extends ISkillOptions {
    /**
     * 用语音的概率。默认0.5，即一半。
     */
    probability?: number;
    /**
     * 当判别使用语音时，如果此值为true，会移除语音可能无法阅读的内容。默认false，即遇到无法阅读的，取消语音转换
     */
    deleteUnreadableText?: boolean;
}
declare abstract class BaseTTSSkill implements ISkill {
    protected _options: IBaseTTSSkillOptions;
    static params: ISkillParams;
    constructor(_options: IBaseTTSSkillOptions);
    protected _logger: ILogger;
    protected abstract get _maxToken(): number;
    get options(): IBaseTTSSkillOptions;
    get params(): ISkillParams;
    init(): Promise<void>;
    applyOnReply(content: SourceChatContent, messageType: SourceChatMessageType, sourceData: IAgentChatEventData, allContent?: string): Promise<{
        content: SourceChatContent;
        messageType: SourceChatMessageType;
    }>;
    protected abstract getAudioBuffer(text: string, sourceData: IAgentChatEventData): Promise<Buffer>;
}

interface ISoviteRequestOptions {
    text: string;
    text_language?: "zh" | "en" | "ja" | "ko" | "yue";
    refer_wav_path?: string;
    prompt_text?: string;
    prompt_language?: "zh" | "en" | "ja" | "ko" | "yue";
    top_k?: number;
    top_p?: number;
    temperature?: number;
    speed?: number;
    inp_refs?: string[];
}
interface ISoviteTTSSkillOptions extends IBaseTTSSkillOptions {
    apiHost: string;
    authType?: "basic" | "jwt" | "none";
    /**
     * jwt认证的时候需要提供
     */
    jwt?: string;
    /**
     * basic认证的时候需要提供
     */
    userName?: string;
    /**
     * basic认证的时候需要提供
     */
    password?: string;
    /**
     * 是否是流式返回，目前不支持流式，请保持为空或者false
     */
    isStreaming?: boolean;
    /**
     * 调用接口时额外的参数
     */
    customReqOptions?: Omit<ISoviteRequestOptions, "text">;
}
declare class SoviteTTSSkill extends BaseTTSSkill {
    protected _options: ISoviteTTSSkillOptions;
    static params: ISkillParams;
    constructor(_options: ISoviteTTSSkillOptions);
    private _headers;
    protected get _maxToken(): number;
    get options(): ISoviteTTSSkillOptions;
    get params(): ISkillParams;
    init(): Promise<void>;
    getAudioBuffer(text: string): Promise<Buffer>;
}

interface IBaiduSTTSkillOptions extends IBaseSTTSkillOptions {
    appId: string;
    apiKey: string;
    secretKey: string;
}
declare class BaiduSTTSkill extends BaseSTTSkill {
    protected _app: PPAgent;
    protected _options: IBaiduSTTSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IBaiduSTTSkillOptions);
    private _client;
    get options(): IBaiduSTTSkillOptions;
    get params(): ISkillParams;
    protected _getText(file: IAsyncFile): Promise<string>;
}

interface IBaiduTTSSkillOptions extends IBaseTTSSkillOptions {
    appId: string;
    apiKey: string;
    secretKey: string;
    /**
     * 语速，0-5
     */
    spd: number;
    /**
     * 音量大小，精品库0-15，其他0-9
     */
    vol: number;
    /**
     * 度小宇=1，度小美=0，度逍遥（基础）=3，度丫丫=4
     * 精品发音人选择：度逍遥（精品）=5003，度小鹿=5118，度博文=106，度小童=110，度小萌=111，度米朵=103，度小娇=5
     * 臻品度逍遥（臻品）=4003，度博文=4106，度小贤=4115，度小鹿=4119，度灵儿=4105，度小乔=4117，度小雯=4100，度米朵=4103，度姗姗=4144，度小贝=4278，度清风=4143，度小新=4140，度小彦=4129，度星河=4149，度小清=4254，度博文=4206，南方=4226
     */
    per: number;
    /**
     * 音调，取值0-9，默认为5中语调
     */
    pit: number;
    /**
     * 3为mp3格式(默认)； 4为pcm-16k；5为pcm-8k；6为wav（内容同pcm-16k）; 注意aue=4或者6是语音识别要求的格式，但是音频内容不是语音识别要求的自然人发音，所以识别效果会受影响。
     */
    aue: number;
}
declare class BaiduTTSSkill extends BaseTTSSkill {
    private _app;
    protected _options: IBaiduTTSSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IBaiduTTSSkillOptions);
    private _client;
    protected get _maxToken(): number;
    get options(): IBaiduTTSSkillOptions;
    get params(): ISkillParams;
    protected getAudioBuffer(text: string, sourceData: IAgentChatEventData): Promise<Buffer>;
}

interface IBaseDrawSkillOptions extends ISkillOptions {
    /**
     * 绘图触发词，默认画图,画画，画图
     */
    triggerWords?: string;
    replyFormat?: "TEXT" | "IMAGE" | "URL" | "VIDEO" | "FILE";
    apiBase: string;
    apiKey: string;
    model: string;
    size: string;
    /**
     * 优化器的bot的instanceName
     */
    optimizer?: string;
    /**
     * 是否使用大模型优化。
     */
    useLLM?: boolean;
}
interface IDrawResult {
    url: string;
    text?: string;
    coverUrl?: string;
}
declare abstract class BaseDrawSkill implements ISkill {
    protected _app: PPAgent;
    protected _options: IBaseDrawSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IBaseDrawSkillOptions);
    protected _logger: ILogger;
    get options(): ISkillOptions;
    get params(): IConfigParams;
    init(): Promise<void>;
    protected abstract _draw(text: string, userId: string, data: IAgentChatEventData): Promise<IDrawResult>;
    applyOnSource(data: IAgentChatEventData): Promise<void>;
}

interface ICogVideoDrawSkillOptions extends IBaseDrawSkillOptions {
    /**
     * 视频生成超时时间，避免永久循环查询结果，默认180秒
     */
    timeout?: number;
    /**
     * 是否生成音频，默认false
     */
    withAudio?: boolean;
}
declare class CogVideoDrawSkill extends BaseDrawSkill {
    protected _app: PPAgent;
    protected _options: ICogVideoDrawSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: ICogVideoDrawSkillOptions);
    protected _draw(prompt: string, userId: string): Promise<IDrawResult>;
}

interface ICogviewDrawSkillOptions extends IBaseDrawSkillOptions {
}
declare class CogviewDrawSkill extends BaseDrawSkill {
    protected _app: PPAgent;
    protected _options: ICogviewDrawSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: ICogviewDrawSkillOptions);
    protected _draw(prompt: string, userId: string): Promise<IDrawResult>;
}

interface IFishAudioTTSSkillOptions extends IBaseTTSSkillOptions {
    apiKey: string;
    baseUrl?: string;
    referenceId: string;
}
declare class FishAudioTTSSkill extends BaseTTSSkill {
    protected _app: PPAgent;
    protected _options: IFishAudioTTSSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IFishAudioTTSSkillOptions);
    protected get _maxToken(): number;
    get options(): IFishAudioTTSSkillOptions;
    get params(): ISkillParams;
    protected getAudioBuffer(text: string): Promise<Buffer>;
}

interface IOpenAIDrawSkillOptions extends IBaseDrawSkillOptions {
    quality: "standard" | "hd";
}
declare class OpenAIDrawSkill extends BaseDrawSkill {
    protected _app: PPAgent;
    protected _options: IOpenAIDrawSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IOpenAIDrawSkillOptions);
    protected _draw(prompt: string, userId: string): Promise<IDrawResult>;
}

interface IOpenAISTTSkillOptions extends IBaseSTTSkillOptions {
    apiKey: string;
    baseUrl?: string;
    model: string;
}
declare class OpenAISTTSkill extends BaseSTTSkill {
    protected _app: PPAgent;
    protected _options: IOpenAISTTSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IOpenAISTTSkillOptions);
    protected _client: OpenAI;
    init(): Promise<void>;
    get options(): IOpenAISTTSkillOptions;
    get params(): ISkillParams;
    protected _getText(file: IAsyncFile): Promise<string>;
}

interface IOpenAITTSSkillOptions extends IBaseTTSSkillOptions {
    apiKey: string;
    baseUrl?: string;
    model: string;
    voice: string;
    /**
     * 语速 0.25-4，默认1
     */
    speed?: number;
}
declare class OpenAITTSSkill extends BaseTTSSkill {
    protected _app: PPAgent;
    protected _options: IOpenAITTSSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IOpenAITTSSkillOptions);
    protected _format: string;
    protected get _maxToken(): number;
    get options(): IOpenAITTSSkillOptions;
    get params(): ISkillParams;
    protected _updateBody(body: any): any;
    protected getAudioBuffer(text: string): Promise<Buffer>;
}

interface ISiliconFlowDrawSkillOptions extends IBaseDrawSkillOptions {
    customOptions?: any;
}
declare class SiliconFlowDrawSkill extends BaseDrawSkill {
    protected _app: PPAgent;
    protected _options: ISiliconFlowDrawSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: ISiliconFlowDrawSkillOptions);
    protected _draw(prompt: string): Promise<IDrawResult>;
}

interface ISiliconFlowSTTSkillOptions extends IBaseSTTSkillOptions {
    apiKey: string;
    baseUrl?: string;
    model: string;
}
declare class SiliconFlowSTTSkill extends OpenAISTTSkill {
    protected _app: PPAgent;
    protected _options: ISiliconFlowSTTSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: ISiliconFlowSTTSkillOptions);
    get options(): ISiliconFlowSTTSkillOptions;
    get params(): ISkillParams;
}

interface ISiliconFlowTTSSkillOptions extends IOpenAISTTSkillOptions {
    apiKey: string;
    baseUrl?: string;
    model: string;
    voice: string;
    /**
     * 语速 0.25-4，默认1
     */
    speed?: number;
}
declare class SiliconFlowTTSSkill extends OpenAITTSSkill {
    protected _app: PPAgent;
    protected _options: ISiliconFlowTTSSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: ISiliconFlowTTSSkillOptions);
    protected _format: string;
    get options(): ISiliconFlowTTSSkillOptions;
    get params(): ISkillParams;
    protected _updateBody(body: any): any;
    protected getAudioBuffer(text: string): Promise<Buffer>;
}

interface ITencentSTTSkillOptions extends IBaseSTTSkillOptions {
    secretId: string;
    secretKey: string;
}
declare class TencentSTTSkill extends BaseSTTSkill {
    protected _app: PPAgent;
    protected _options: ITencentSTTSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: ITencentSTTSkillOptions);
    private _client;
    init(): Promise<void>;
    get options(): ITencentSTTSkillOptions;
    get params(): ISkillParams;
    protected _getText(file: IAsyncFile): Promise<string>;
}

interface ITencentTTSSkillOptions extends IBaseTTSSkillOptions {
    secretId: string;
    secretKey: string;
    /**
     * 语速，[-2.6]，默认0
     */
    spd: number;
    /**
     * 音量大小，[-10,10]，默认0
     */
    vol: number;
    /**
     * 详见 https://cloud.tencent.com/document/product/1073/92668 的基础语音合成音色
     */
    voice?: number;
}
declare class TencentTTSSkill extends BaseTTSSkill {
    private _app;
    protected _options: ITencentTTSSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: ITencentTTSSkillOptions);
    private _client;
    protected get _maxToken(): number;
    init(): Promise<void>;
    get options(): ITencentTTSSkillOptions;
    get params(): ISkillParams;
    protected getAudioBuffer(text: string): Promise<Buffer>;
}

interface IXunfeiSTTSkillOptions extends IBaseSTTSkillOptions {
    appId: string;
    apiKey: string;
    secretKey: string;
}
declare class XunfeiSTTSkill extends BaseSTTSkill {
    protected _app: PPAgent;
    protected _options: IXunfeiSTTSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IXunfeiSTTSkillOptions);
    private _hostUrl;
    private _host;
    private _uri;
    private _frame;
    get options(): IXunfeiSTTSkillOptions;
    get params(): ISkillParams;
    private _getAuthStr;
    private _getFrame;
    protected _getText(file: IAsyncFile): Promise<string>;
}

interface IXunfeiTTSSkillOptions extends IBaseTTSSkillOptions {
    appId: string;
    apiKey: string;
    secretKey: string;
    /**
     * 语速，0-100
     */
    speed: number;
    /**
     * 0-100
     */
    volume: number;
    /**
     * 发音人，如 xiaoyan  请在讯飞控制台查看
     */
    vcn: string;
    /**
     * 音调（音高），取值0-100
     */
    pitch: number;
    /**
     * 用语音的概率。默认0.5，即一半。增加随机性。
     */
    probability?: number;
    /**
     * 当判别使用语音时，如果此值为true，会移除语音可能无法阅读的内容。默认false，即遇到无法阅读的，取消语音转换。
     */
    deleteUnreadableText?: boolean;
}
declare class XunfeiTTSSkill extends BaseTTSSkill {
    private _app;
    protected _options: IXunfeiTTSSkillOptions;
    static params: ISkillParams;
    constructor(_app: PPAgent, _options: IXunfeiTTSSkillOptions);
    private _hostUrl;
    private _host;
    private _uri;
    get options(): IXunfeiTTSSkillOptions;
    get params(): ISkillParams;
    protected get _maxToken(): number;
    private _getAuthStr;
    protected getAudioBuffer(text: string): Promise<Buffer>;
}

interface IDingRobotSourceOptions extends ISourceOptions {
    clientId: string;
    clientSecret: string;
    corpId: string;
    apiHost?: string;
    oldApiHost?: string;
    agentId: number;
    robotCode: string;
    /**
     * 如果不设置，则使用环境变量中的值，设置该值优先
     */
    debug?: boolean;
    /**
     * 当发送文本类消息的时候，钉钉支持提供一个标题，标题会在列表中展示。默认是AI回复的前16个字。
     *
     * 如果配置这个参数，则会固定用这个标题
     */
    markdownMsgTitle?: string;
    /**
     * 发送音频时的格式，默认amr，可选wav（部分wav可能手机会播放失败），amr文件尺寸小，效率略低于wav。
     *
     * 目前测试wav格式支持客户端播放，但是转文字会失败。
     */
    sendAudioFormat?: "wav" | "amr";
    /**
     * 如果配置为AI卡片，则开启了流式回复，则需要配置streamTemplateId，否则流式回复不会生效
     * 可以参考着创建：https://open.dingtalk.com/document/orgapp/typewriter-effect-streaming-ai-card
     *
     * 此外还需要开放应用的卡片相关权限（后台应用权限搜索卡片全选批量开通即可）
     *
     * 使用卡片时候，因只支持markdown类型，即text类型，因此要关闭相关文字转语音技能对该source的使用，否则会出现卡片没有内容更新的情况。
     */
    streamTemplateId?: string;
    /**
     * 联系人缓存时间，单位是秒，默认24小时
     */
    contactsCacheTime?: number;
    /**
     * 联系人的列表ID，可以从钉钉api explorer里面相关接口获取（从根路径开始一层层获取）
     *
     * 默认1，表示根路径，如果只希望对部分部门的用户可被前端选取，可以这里设置上级部门ID
     *
     * 该配置仅影响前端选择联系人的数量，不影响消息监听
     */
    contactDepartId?: number;
    /**
     * 是否在系统启动的时候就自动获取联系人。默认false。
     *
     * 如果员工较多，建议启动的时候获取，避免第一次使用的时候等待时间过长。
     */
    contactAutoloadOnStart?: boolean;
    /**
     * 由于递归调用获取用户接口可能触发限流，此时可以设置获取间隔，默认是30ms一次。
     */
    contactSleepMS?: number;
}
interface IDingRobotSourceParams extends ISourceParamas {
    supportedFileExts: string[];
}
/**
 * 需要开启机器人发消息相关权限、通讯录和部门管理相关权限、应用管理相关权限、互动卡片相关权限
 *
 * 钉钉支持直接引用外部图片显示，因此需要本服务器具备公网访问能力
 *
 * 钉钉应用机器人暂不支持@人，webhook机器人支持，因此可以配合使用
 */
declare class DingRobotSource implements ISource, IDisposable {
    private _app;
    private _options;
    static params: IDingRobotSourceParams;
    constructor(_app: PPAgent, _options: IDingRobotSourceOptions);
    private _token;
    private _oldToken;
    private _talkClient;
    private _me;
    private _trackIdCache;
    private _contacts;
    private _contactLoadingPromise;
    private _departIdNameMap;
    get params(): ISourceParamas;
    get options(): IDingRobotSourceOptions;
    get actions(): ISourceActionInfo[];
    event: Emittery;
    private _loadToken;
    private _api;
    private _oldApi;
    private _downloadMedia;
    private _onChatMessage;
    private _sendByWebhook;
    private _getPublicUrl;
    private _uploadMediaFile;
    private _sendByAPI;
    private _getDepartList;
    private _getDepartUsers;
    me(): Promise<ISourceUserInfo>;
    hasLogin(): boolean;
    login(): Promise<void>;
    beforeSend(sourceMessage: ISourceChatMessage): Promise<void>;
    afterSend(sourceMessage: ISourceChatMessage): Promise<void>;
    sendMessage(message: ISourceChatMessage, fromMessage?: ISourceChatMessage): Promise<string>;
    getContacts(mode: "all" | "user" | "group", forece?: boolean): Promise<({
        nickName: string;
    } & Partial<ISourceUserInfo>)[]>;
    getContactDetail(baseInfo: ISourceUserInfo): Promise<ISourceUserInfo>;
    dispose(): Promise<string>;
}

interface IFeishuSourceOptions extends ISourceOptions {
    appId?: string;
    appSecret?: string;
    verificationToken?: string;
    encryptKey?: string;
    /**
     * 默认是 https://open.feishu.cn
     */
    domain?: string;
    /**
     * 联系人缓存时间，单位是秒，默认24小时
     */
    contactsCacheTime?: number;
    /**
     * 联系人的列表ID，如果以od-开头表示飞书自动生成的开放id，否则认为是自定义的id
     *
     * 默认0，表示根路径，如果只希望对部分部门的用户可被前端选取，可以这里设置上级部门ID
     *
     * 该配置仅影响前端选择联系人的数量，不影响消息监听
     *
     * 注意，系统内部使用的都是自定义的departmentId，在部门创建时可以指定或者自动生成，客户端内可查看或者编辑。
     */
    contactDepartId?: string;
    /**
     * 是否忽略非用户发送的消息，默认true
     */
    ignoreNoneUserMessage?: boolean;
    /**
     * 文本消息的回复方式，默认使用text格式。如果设置为stream，将会使用卡片模拟流式输出。
     *
     * text模式下，简单的markdown标签可以显示，图片标签会被转为普通的超链
     *
     * rich_text下，markdown的图片标签会被提取单独显示，其他内容会以markdown显示（飞书markdown不支持富文本消息中的图片标签）
     *
     * stream下，markdown中的图片标签会被提取并上传到飞书，且嵌入在原来位置显示
     */
    replayTextMode?: "text" | "rich_text" | "stream";
    /**
     * 当配置输出位stream时，需要提供卡片ID，否则将使用默认的卡片模板
     */
    cardId?: string;
    /**
     * 当使用富文本形式回复时，是否启用标题，默认false
     */
    richTextTitle?: boolean;
    /**
     * 富文本标题模板，可以使用{title}来占位，内容是用户提问的内容的最多前10个字符（未找到则使用用户昵称），默认是RE:{title}，仅开启富文本回复和启用富文本标题后生效
     */
    richTextTitleTemplate?: string;
    /**
     * 启用流式回复时，正在思考的提示语，默认是"正在思考中..."
     */
    thinkingTips?: string;
    /**
     * 收到的语音转为wav时的通道数，不设置则采用ffmpeg的默认值。
     */
    wavChannel?: number;
    /**
     * 收到的语音转为wav时的采样率，不设置则使用ffmpeg的默认值。
     */
    wavSampleRate?: number;
}
/**
 * 飞书的应用消息源，要注意使用了长连接进行监听，不能启动多个参数相同的消息源，只有其中一个会接收到消息
 *
 * 涉及到用户或者群组信息时，userId是对应的用户open_id或者群组的open_id，userName对应的用户userId或者群组自定义id（仅在需要单独调用消息发送接口时会用到）
 *
 * 至少需要基本的机器人消息权限、获取用户基本信息、通讯录中获取部门列表及用户列表相关权限、卡片消息相关权限
 *
 * 由于飞书的自定义机器人没有权限直接上传图片文件，因此只能发送文本信息、不带图的富文本信息和不带图的卡片消息
 */
declare class FeishuSource implements ISource, IDisposable {
    private _app;
    private _options;
    static params: ISourceParamas;
    constructor(_app: PPAgent, _options: IFeishuSourceOptions);
    private _me;
    private _client;
    private _wsClient;
    private _connected;
    private _departCache;
    private _userCache;
    private _trackIdCache;
    get params(): ISourceParamas;
    get options(): IFeishuSourceOptions;
    get actions(): ISourceActionInfo[];
    event: Emittery;
    private _getResourceFile;
    private _getRichTextContent;
    private _processChatMessage;
    private _handleChatMessage;
    private _getDepartList;
    private _getDepartUsers;
    private _uploadImage;
    private _uploadFile;
    private _getSimpleLinkContent;
    private _getSendMessageContent;
    private _sendWebhookMessage;
    me(force?: boolean): Promise<ISourceUserInfo>;
    hasLogin(): boolean;
    login(): Promise<void>;
    beforeSend(message: ISourceChatMessage): Promise<void>;
    afterSend(message: ISourceChatMessage): Promise<void>;
    sendMessage(message: ISourceChatMessage, fromMessage?: ISourceChatMessage): Promise<string>;
    getContacts(mode: "all" | "user" | "group", force?: boolean): Promise<({
        nickName: string;
    } & Partial<ISourceUserInfo>)[]>;
    getContactDetail(baseInfo: ISourceUserInfo): Promise<ISourceUserInfo>;
    dispose(): Promise<string>;
}

interface IQQSourceOptions extends ISourceOptions {
    appId: string;
    token?: string;
    appSecret: string;
    /**
     * API地址，如果要强行开启沙箱模式，可以配置为沙箱的api地址，否则根据NODE_ENV环境变量是否为development来决定
     */
    apiBase?: string;
    /**
     * 用于获取token的api域名，默认是 https://bots.qq.com
     */
    tokenBase?: string;
    /**
     * 机器人的身份，可自行指定
     */
    me: ISourceUserInfo;
    /**
     * 音频编码的码率，默认32000，可选8000/12000/16000/24000/32000/44100/48000
     */
    audioEncodeRate?: number;
    /**
     * 音频解码的码率，默认为32000,可选8000/12000/16000/24000/32000/44100/48000
     */
    audioDecodeRate?: number;
    /**
     * 是否获邀使用markdown功能，如果有权限，可以设置为true，默认为false。
     */
    canUseMarkdown?: boolean;
    /**
     * 消息ID缓存的有效期，默认是20小时，用于避免重复消息接收，单位是小时
     */
    messageIdCacheHourPeriod?: number;
}
declare class QQSource implements ISource {
    private _app;
    private _options;
    static params: ISourceParamas;
    constructor(_app: PPAgent, _options: IQQSourceOptions);
    private _logger;
    private _accessToken;
    private _signKeyPair;
    private _msgIdCache;
    event: Emittery;
    get params(): ISourceParamas;
    get options(): ISourceOptions;
    get actions(): ISourceActionInfo[];
    private _checkSignature;
    private _verifyCallback;
    private _processChatMessage;
    private _onMessage;
    private _initToken;
    private _uploadFile;
    private _getArkContent;
    hasLogin(): boolean;
    me(): Promise<ISourceUserInfo>;
    login(): Promise<void>;
    sendMessage(message: ISourceChatMessage, fromMessage?: ISourceChatMessage): Promise<string>;
    getContacts(): Promise<({
        nickName: string;
    } & Partial<ISourceUserInfo>)[]>;
    getContactDetail(baseInfo: ISourceUserInfo): Promise<ISourceUserInfo>;
}

interface IWCAISourceOptions extends ISourceOptions {
    /**
     * 对话开放平台的appId
     */
    appId: string;
    token: string;
    aesKey: string;
    apiBase?: string;
    /**
     * 用来识别公众平台消息源（机器人）的信息，可以自定义
     */
    me: ISourceUserInfo;
}
/**
 * 微信对话开放平台的消息源。支持公众号、企业微信、小程序、微信客服、网页H5
 */
declare class WCAISource implements ISource {
    private _app;
    private _options;
    static params: ISourceParamas;
    constructor(_app: PPAgent, _options: IWCAISourceOptions);
    private _logger;
    get params(): ISourceParamas;
    get options(): ISourceOptions;
    get actions(): ISourceActionInfo[];
    event: Emittery;
    private _processMessage;
    private _onChatMessage;
    me(): Promise<ISourceUserInfo>;
    hasLogin(): boolean;
    login(): Promise<void>;
    sendMessage(message: ISourceChatMessage, fromMessage?: ISourceChatMessage): Promise<string>;
    getContacts(mode: "all" | "user" | "group", force?: boolean): Promise<({
        nickName: string;
    } & Partial<ISourceUserInfo>)[]>;
    getContactDetail(baseInfo: ISourceUserInfo): Promise<ISourceUserInfo>;
}

interface IWCOASourceOptions extends ISourceOptions {
    appId: string;
    appSecret: string;
    token: string;
    aesKey: string;
    apiBase?: string;
}
/**
 * 微信公众平台的消息源。
 */
declare class WCOASource implements ISource {
    private _options;
    static params: ISourceParamas;
    constructor(_options: IWCOASourceOptions);
    private _token;
    private _sendMessageUrl;
    private _me;
    get params(): ISourceParamas;
    get options(): IWCOASourceOptions;
    get actions(): ISourceActionInfo[];
    event: Emittery;
    private _onCheckSignature;
    private _loadToken;
    private _loadMediaFile;
    private _uploadMediaFile;
    private _processMessage;
    private _onChatMessage;
    private _setTyping;
    me(): Promise<ISourceUserInfo>;
    hasLogin(): boolean;
    login(): Promise<void>;
    sendMessage(message: ISourceChatMessage, fromMessage?: ISourceChatMessage): Promise<string>;
    getContacts(mode: "all" | "user" | "group", force?: boolean): Promise<({
        nickName: string;
    } & Partial<ISourceUserInfo>)[]>;
    getContactDetail(baseInfo: ISourceUserInfo): Promise<ISourceUserInfo>;
}

interface IWeWorkSourceOptions extends ISourceOptions {
    agentId?: string;
    secret?: string;
    corpId?: string;
    token?: string;
    aesKey?: string;
    apiHost?: string;
    /**
     * 转人工关键词列表，默认为 ["人工"]，即只要消息中包含了这个关键词，就会将客服状态转为人工接管。暂未启用。
     *
     * 前提是配置了人工接待账号
     */
    manualKeyWords?: string[];
    /**
     * 接待人员列表。目前策略为随机选择一个接待人员（还是放入接待池？）暂未启用。
     */
    manualUsers?: string[];
    /**
     * 客服模式下，用户第一次进入时是否发送欢迎语，如果是的话，可以通过设置prompt让bot生成一段欢迎的话。
     *
     * 默认false
     */
    welcomeInKfMode?: boolean;
    /**
     * 欢迎词的提示语,可以使用{nickName}对用户的昵称进行占位，如果提示语以双下划线开头，则会直接发送这段话，注意这时将不经过agent。如：__欢迎{nickName}，有任何问题都可以跟我咨询。
     */
    welcomePrompt?: string;
    /**
     * 需要该应用自动创建的群聊。由于只有应用创建的群聊才能够主动推送群消息，因此需要先创建群聊。
     *
     * 注意务必指定群聊的ID，以便后续发消息时进行引用。
     *
     * 如果已经存在的群聊会提示重复，不影响。
     */
    appChatGroups?: {
        /**
         * 第一个人是群主
         */
        userlist: string[];
        /**
         * 群聊ID
         */
        chatid: string;
        /**
         * 群名称
         */
        name: string;
    }[];
}
/**
 * 企业微信应用的消息源。支持应用单聊，客服聊天以及应用和机器人的单向群推送（应用推送仅支持通过应用接口创建的群，没有机器人方便，且机器人支持Markdown，但是机器人不支持发送视频）
 * 群消息一次只发送一个群。只有机器人消息支持@
 *
 * 如果希望一次性发给一群人，可以使用应用单聊同事发送多个对象，支持发群到部门ID或者标签ID，而不需要通过群
 *
 * 注意：当启动后第一次收到客服消息时，仅会处理最新的一条客服消息。后续有新的消息进来时，将会处理最后一次到当前消息之间所有的消息。
 *
 * 企微的客服逻辑：创建应用-设置应用可以通过API访问（允许的JS回调需先配置）以及可信IP-设置API接收，勾选接收客服消息；微信客服中创建一个客服，指定一个接待人员，最下方打开通过API管理会话消息的企业内部开发，选中之前创建的应用
 *
 * 这样就可以通过这个应用来管理刚创建的客服的对话了，默认是机器人接管状态，有需要转人工可通过调用转人工接口实现转人工或者其他状态的流转。
 */
declare class WeWorkSource implements ISource {
    private _app;
    private _options;
    static params: ISourceParamas;
    constructor(_app: PPAgent, _options: IWeWorkSourceOptions);
    private _apiHost;
    private _token;
    private _me;
    private _cacheManager;
    get params(): ISourceParamas;
    get options(): ISourceOptions;
    get actions(): ISourceActionInfo[];
    event: Emittery;
    private _loadToken;
    private _checkSignature;
    private _loadMediaFile;
    private _uploadMediaFile;
    private _uploadAppMediaFile;
    private _uploadRobotMediaFile;
    private _processKfMessage;
    private _processKfUserEventMessage;
    private _onKfMessage;
    private _processEventMessage;
    private _processAppMessage;
    private _onMessage;
    private _api;
    private _sendAppGroupMessage;
    private _sendRobotMessage;
    private _sendKfMessage;
    private _sendAppMessage;
    me(force?: boolean): Promise<ISourceUserInfo>;
    hasLogin(): boolean;
    login(): Promise<void>;
    sendMessage(message: ISourceChatMessage, fromMessage?: ISourceChatMessage): Promise<string>;
    getContacts(mode: "all" | "user" | "group", force?: boolean): Promise<({
        nickName: string;
    } & Partial<ISourceUserInfo>)[]>;
    getContactDetail(baseInfo: ISourceUserInfo): Promise<ISourceUserInfo>;
    createAppGroupChats(info: {
        userlist: string[];
        chatid: string;
        name: string;
    }[]): Promise<void>;
}

interface ICronTaskTriggerOptions extends ITaskTriggerOptions {
    cron: string;
    context?: any;
}
declare class CronTaskTrigger extends TaskTrigger {
    protected app: PPAgent;
    protected _options: ICronTaskTriggerOptions;
    static params: ITaskTriggerParams;
    constructor(app: PPAgent, _options: ICronTaskTriggerOptions);
    private _job;
    private _logger;
    get options(): ICronTaskTriggerOptions;
    get params(): ITaskTriggerParams;
    dispose(): Promise<string>;
}

declare class EchoTaskRunner implements ITaskRunner {
    private _app;
    private _options;
    static params: ITaskRunnerParams;
    constructor(_app: PPAgent, _options: ITaskRunnerOptions);
    get options(): ITaskRunnerOptions;
    get params(): ITaskRunnerParams;
    run(data?: ITaskTriggerData): Promise<ITaskRunResult>;
}

/**
 * 消息触发类任务收到的消息内容
 */
interface ITaskEventTriggerData extends ITaskTriggerData {
    triggerName: string;
    eventName: string;
}
/**
 * 消息触发类任务属性
 */
interface IEventTaskTriggerOptions extends ITaskTriggerOptions {
    eventNames: string[];
}
/**
 * 数据源消息触发类任务属性
 */
interface ISourceEventTaskTriggerOptions extends IEventTaskTriggerOptions {
    /**
     * 使用实例名称来配置，只监听指定的实例上的消息，与sourceNames是或的关系
     */
    sourceInstanceNames: string[];
    /**
     * 使用消息源类型名称来配置，该类型下的所有源的消息都被监听，与sourceInstanceNames是或的关系
     */
    sourceNames: string[] | string;
    /**
     * 消息规则，不配置则不过滤
     */
    messageRule?: IMessageRule;
}
/**
 * 消息类触发任务基础类型。封装了消息注册逻辑，子类只需提供可被监听的实例和名称。
 */
declare abstract class EventTaskTrigger extends TaskTrigger {
    protected app: PPAgent;
    protected _options: IEventTaskTriggerOptions;
    constructor(app: PPAgent, _options: IEventTaskTriggerOptions);
    private _initialized;
    private _logger;
    private _disposers;
    protected abstract get loggerName(): string;
    protected get logger(): ILogger;
    dispose(): Promise<string>;
    protected init(): void;
    protected abstract getEventTriggers(): {
        name: string;
        trigger: Emittery;
    }[];
}
declare class SourceEventTaskTrigger extends EventTaskTrigger {
    protected app: PPAgent;
    protected _options: ISourceEventTaskTriggerOptions;
    static params: ITaskTriggerParams;
    constructor(app: PPAgent, _options: ISourceEventTaskTriggerOptions);
    protected get loggerName(): string;
    get options(): ISourceEventTaskTriggerOptions;
    get params(): ITaskTriggerParams;
    protected getEventTriggers(): {
        name: string;
        trigger: Emittery;
    }[];
}
declare class GlobalEventTaskTrigger extends EventTaskTrigger {
    protected app: PPAgent;
    protected _options: IEventTaskTriggerOptions;
    static params: ITaskTriggerParams;
    constructor(app: PPAgent, _options: IEventTaskTriggerOptions);
    protected get loggerName(): string;
    get options(): IEventTaskTriggerOptions;
    get params(): ITaskTriggerParams;
    protected getEventTriggers(): {
        name: string;
        trigger: Emittery;
    }[];
}

interface IChatMessageTaskRunnerOptions extends ITaskRunnerOptions {
}
declare class ChatMessageTaskRunner implements ITaskRunner {
    private _app;
    private _options;
    static params: ITaskRunnerParams;
    constructor(_app: PPAgent, _options: IChatMessageTaskRunnerOptions);
    private _logger;
    get options(): ITaskRunnerOptions;
    get params(): ITaskRunnerParams;
    run(data?: ITaskEventTriggerData): Promise<ITaskRunResult>;
}

declare class ChatMessage {
    id: string;
    msgId: string;
    type: string;
    fromId: string;
    createdAt: number;
    senderId: string;
    senderName?: string;
    senderNickName?: string;
    senderAvatar?: string;
    isGroupChat?: boolean;
    isSender?: boolean;
    customType?: string;
    raw: string;
    sourceName: string;
    sourceInstanceName: string;
    text?: string;
    static fromMessage(message: ISourceChatMessage, source: ISource): ChatMessage;
    static toMessage(chatMessage: ChatMessage): ISourceChatMessage;
}

declare const chatSource: DataSource;
declare const chatMessageRepo: typeorm.Repository<ChatMessage>;

declare const addWavHeader: (samples: ArrayBuffer, sampleRateTmp: number, sampleBits: number, channelCount: number) => ArrayBuffer;
declare function removeEmoji(text: string): string;
declare function removeMarkdown(text: string): string;
declare function hasEmoji(text: string): boolean;
declare function hasMarkdown(text: string): boolean;
declare function extractArticleInfo(articleContent: SourceChatArticleContent): string;
declare function extractPositionInfo(positionContent: SourceChatPositionContent): string;
declare function betterMarkdown(text: string): string;
declare function disposeObjects(objs: IDisposable[]): Promise<void>;
declare function arm2wav(buffer: Buffer): Promise<IAsyncFile>;
declare function wav2amr(file: IAsyncFile): Promise<{
    file: IAsyncFile;
    duration: number;
}>;
declare function createCacheManager(namespace: string): Keyv;
declare function getSecret(key: string): string;
declare function isPhoneNumber(text: string): boolean;
declare function generateRandomString(length?: number): string;
declare function transFormat(inputPath: string, outFilePath: string, toFormat: string, preCommand?: (command: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand): Promise<boolean>;
declare function transFileFormat(inputFile: IAsyncFile, toFormat: string, preCommand?: (command: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand): Promise<IAsyncFile>;
declare function extractImageUrls(text: string, onlyMarkdonw?: boolean): string[];
declare function extractMarkdownImageTags(text: string): string[];
/**
 * 根据文件内容生成文件名，只支持二进制数据
 * @param buffer
 * @param name
 * @returns
 */
declare function detectName(buffer: Buffer | string, name?: string): Promise<string>;
declare function stream2buffer(stream: ReadStream$1): Promise<Buffer>;
declare function sse(stream: any, onJSONContent: (content: any) => void): Promise<void>;
declare function richText2Markdown(content: SourceChatRichTextContent): Promise<string>;
declare function getFromMessageSummary(message: ISourceChatMessage, source?: ISource): string;
declare function getToMessageSummary(message: ISourceChatMessage, source?: ISource): string;
declare function createFormilySchema<Decorator, Component, DecoratorProps, ComponentProps, Pattern, Display, Validator, Message>(properties: SchemaProperties<Decorator, Component, DecoratorProps, ComponentProps, Pattern, Display, Validator, Message>): IConfigSchema;
declare function removeTextAt(text: string): string;
declare function filterContentRule(text: string, r: IMessageContentRule): boolean;
declare function sleep(ms: number): Promise<void>;
declare function checkMessageRule(r: IMessageRule, data: ISourceChatMessageEventData): boolean;
declare function installDep(name: string, registry: string, version?: string, check?: boolean): Promise<any>;
declare function installAndGetPluginInfo(name: string, version?: string, registry?: string): Promise<IOnlinePluginInfo>;
declare function uninstallDep(name: string): Promise<IOnlinePluginInfo>;
declare function getEnvNumber(key: string): number | undefined;
declare function extractMessageContentText(content: SourceChatContent): string;
declare function createFakeMessage(type: SourceChatMessageType, content: SourceChatContent, customData?: IAgentChatEventData): ISourceChatMessage;
declare function directRunBot(bot: IBot, type: SourceChatMessageType, content: SourceChatContent, customData?: IAgentChatEventData, onStream?: (type: SourceChatMessageType, content: SourceChatContent) => void): Promise<{
    text: string;
    all?: {
        content: SourceChatContent;
        type: SourceChatMessageType;
    }[];
}>;

/**
 * 按照进来顺序回调输出
 */
declare class SortedPromise extends Emittery {
    private _queue;
    private _logger;
    add<T>(p: Promise<T>): Promise<T>;
}

export { Agent, type AgentChatMessageReplyType, AgentService, AsyncFile, type AsyncFileLoader, BaiduSTTSkill, BaiduTTSSkill, BaseDrawSkill, BaseSTTSkill, BaseTTSSkill, BasicBot, type BotCreator, BotManager, ChatMessage, ChatMessageTaskRunner, CogVideoDrawSkill, CogviewDrawSkill, CozeBot, CozeService, CronTaskTrigger, DifyAgentBot, DingRobotSource, EchoTaskRunner, EventTaskTrigger, FastGPTBot, FeishuSource, FishAudioTTSSkill, GlobalEvent, GlobalEventNames, GlobalEventTaskTrigger, HistoryMessageManager, type IAgentChatEventData, type IAgentModels, type IAgentOptions, type IAgentServiceOptions, type IAsyncFile, type IAsyncFileSource, type IBaiduSTTSkillOptions, type IBaiduTTSSkillOptions, type IBaseDrawSkillOptions, type IBaseSTTSkillOptions, type IBaseTTSSkillOptions, type IBasicBotOptions, type IBot, type IBotEventData, type IBotFileInfo, type IBotHistoryMessage, type IBotHistoryRecordEventData, type IBotOptions, type IBotParams, type IBotReadyMessage, type IChatMessageTaskRunnerOptions, type ICogVideoDrawSkillOptions, type ICogviewDrawSkillOptions, type IConfigParams, type IConfigSchema, type ICozeBotOptions, type ICozeServiceOptions, type ICronTaskTriggerOptions, type IDifyAgentBotOptions, type IDingRobotSourceOptions, type IDingRobotSourceParams, type IDisposable, type IDrawResult, type IEventTaskTriggerOptions, type IFastGPTBotOptions, type IFeishuSourceOptions, type IFishAudioTTSSkillOptions, type IGlobalEventData, type IGlobalNotifyEventData, type IHisotryMessageManagerOptions, type IInstance, type IInstanceBaseMangerOptions, type IInstanceCreateOptions, type ILastBotMessageInfo, type ILogger, type ILoggerEmitContent, type IMessageContentReceiver, type IMessageContentRule, type IMessageRule, type IModelInfo, type IOllamaBotOptions, type IOnlinePluginInfo, type IOpenAIBotOptions, type IOpenAIDrawSkillOptions, type IOpenAISTTSkillOptions, type IOpenAITTSSkillOptions, type IPPAgentOptions, type IPPAgentPlugin, type IPPAgentPluginHandler, type IPPAgentPluginOptions, type IQAnythingBotOptions, type IQQSourceOptions, type ISenseVoiceSTTSkillOptions, type ISiliconFlowDrawSkillOptions, type ISiliconFlowSTTSkillOptions, type ISiliconFlowTTSSkillOptions, type ISimpleSchemaItem, type ISkill, type ISkillOptions, type ISkillParams, type ISource, type ISourceActionInfo, type ISourceApiAction, type ISourceApiResponseType, type ISourceChatMessage, type ISourceChatMessageEventData, type ISourceEventData, type ISourceEventTaskTriggerOptions, type ISourceGroupChatMessage, type ISourceGroupInfoChangedEventData, type ISourceLoginEventData, type ISourceLogoutEventData, type ISourceOptions, type ISourceParamas, type ISourceResponseMessageEventData, type ISourceSystemEventData, type ISourceTodoEventData, type ISourceUserInfo, type ISourceWSNormalInMessage, type ISourceWSNormalOutMessage, type ISoviteTTSSkillOptions, type ITaskConfig, type ITaskEventTriggerData, type ITaskRunResult, type ITaskRunner, type ITaskRunnerOptions, type ITaskRunnerParams, type ITaskServiceOptions, type ITaskTrigger, type ITaskTriggerData, type ITaskTriggerOptions, type ITaskTriggerParams, type ITencentSTTSkillOptions, type ITencentTTSSkillOptions, type IWCAISourceOptions, type IWCOASourceOptions, type IWeWorkSourceOptions, type IWenxinAgentBotOptions, type IXunfeiBotOptions, type IXunfeiSTTSkillOptions, type IXunfeiTTSSkillOptions, type IYuanQiBotOptions, type IZhipuBotOptions, type IZhipuQingyanBotOptions, InstanceBaseManager, OllamaBot, OpenAIBot, OpenAIDrawSkill, OpenAISTTSkill, OpenAITTSSkill, OpenRouterBot, PPAgent, QAnythingBot, QQSource, SchemaBaseProperties, SenseVoiceSTTSkill, SiliconFlowBot, SiliconFlowDrawSkill, SiliconFlowSTTSkill, SiliconFlowTTSSkill, SimpleSchemaType, type SkillCreator, SkillManager, SkillSchemaBaseProperties, SortedPromise, SourceApiMissingParamsError, SourceApiNotFoundError, SourceApiUnAuthorizedError, type SourceChatArticleContent, type SourceChatAudioContent, type SourceChatCardContent, type SourceChatContactContent, type SourceChatContent, type SourceChatEmotionContent, type SourceChatFileContent, type SourceChatImageContent, type SourceChatMPContent, SourceChatMessageType, type SourceChatMusicContent, type SourceChatPatContentType, type SourceChatPhoneContent, type SourceChatPositionContent, type SourceChatRecallContent, type SourceChatRefContent, type SourceChatRichTextContent, type SourceChatSubscribeContent, type SourceChatSystemContent, type SourceChatTextContent, type SourceChatVideoContent, type SourceCreator, SourceEventTaskTrigger, SourceEventType, SourceManager, type SourceWSCustomAction, type SourceWSNormalAction, SoviteTTSSkill, type TaskRunnerCreator, TaskRunnerManager, TaskRunnerSchemaBaseProperties, TaskService, TaskTrigger, type TaskTriggerCreator, TaskTriggerManager, TencentSTTSkill, TencentTTSSkill, WCAISource, WCOASource, WeWorkSource, WenxinAgentBot, XunfeiBot, XunfeiSTTSkill, XunfeiTTSSkill, YuanQiBot, ZhipuBot, ZhipuQingyanBot, addWavHeader, apiPlugin, arm2wav, betterMarkdown, chatMessageRepo, chatSource, checkMessageRule, config, createCacheManager, createFakeMessage, createFormilySchema, defaultPlugin, detectName, directRunBot, disposeObjects, extractArticleInfo, extractImageUrls, extractMarkdownImageTags, extractMessageContentText, extractPositionInfo, filterContentRule, generateRandomString, getEnvNumber, getFromMessageSummary, getLogger, getSecret, getToMessageSummary, hasEmoji, hasMarkdown, installAndGetPluginInfo, installDep, isPhoneNumber, removeEmoji, removeMarkdown, removeTextAt, richText2Markdown, sleep, sse, stream2buffer, transFileFormat, transFormat, uninstallDep, wav2amr };
