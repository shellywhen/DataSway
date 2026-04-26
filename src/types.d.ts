interface Chat2GPT {
    role: "system" | "user" | "assistant" | "log" | "tool";
    content: string;
}

interface UserMessage extends Chat2GPT {
    role: "user",
}

interface AssistantMessage extends Chat2GPT {
    role: "assistant",
    versionIdx?: number,
    _script?: string,
    _versionIdx?: number,
    isValid?: boolean,
    explanation?: string,
}

interface Point {
    x: number;
    y: number;
}

type Message = UserMessage | AssistantMessage

interface MetaOrderProps {
    isReady: boolean;
    order: number[];
}

interface LinearOrderProps extends MetaOrderProps {
    start: null | Point;
    end: null | Point;
}

interface SpreadOrderProps extends MetaOrderProps {
    center: null | Point;
}

interface SketchOrderProps extends MetaOrderProps {
    points: Point[];
}

interface DataOrderProps {
    order: 'asc' | 'desc',
    rank: boolean
}

interface SnippetConfigProps {
    unit: 'occurance' | 'spatial' | 'random' | 'data',
    spatial: null | 'linear' | 'spread' | 'sketch',
    linear: LinearOrderProps,
    spread: SpreadOrderProps,
    sketch: SketchOrderProps,
    data: DataOrderProps,
    randomSeed: number,
    delay: number,
    offset: number,
    duration: number,
}

interface UnitMsg {
    keyframe: Record<string, any>,
    elaboration: string,
    title: string
}
interface VersionMsg {
    animation?: UnitMsg[],
    message: string,
}

interface _VersionMsg {
    script: string,
    message: string,
}

interface QAMsg {
    isValid: boolean,
    analysis: string,
    explanation: string,
    visEncoding: string
}

interface Snippet {
    code: string;
    obj: Record<string, any>;
    description: string;
    title: string;
    config: SnippetConfigProps
}
interface Version {
    id: number,
    snippets: Snippet[],
    loop: boolean,
    duration: number,
}
  
interface FileListItemProps {
    uid: string;
    name: string;
    status?: UploadFileStatus | undefined;
    url: string;
}
  
interface LogProps {
    type: string;
    content?: string;
    start: string,
    end: string,
    duration: number,
}
interface UserSession {
    id: string;
    log: LogProps[];
    code: string;
    svg: string;
    styles: string[];
    schema?: Record<string, any>;
    data?: Record<string, number | string | Date>[];
    fileList?: FileListItemProps[];
    versions: Version[];
    messages: Message[];
    created_at: string;
    updated_at: string;
    _messages: Message[];
    _versions: string[];
}
  
interface State {
    sessions: UserSession[];
    curSession: string | null;
    token: string;
}

interface ExampleProps {
    svgFile: string,
    styleFiles: string[],
    title?: string,
    description?: string,
    source?: string,
    snippets?: string[],
    script?: string,
    folder?: string,
    thumbnail?: string,
    versions?: Version[],
    messages?: Message[]
}

interface ExampleCase extends ExampleProps {
    snippets: string[],
    script: string
}

interface MessageOption {
    image?: string,
    svg?: string,
    isInspire?: boolean,
    selectedCode?: {
        idx: number,
        code: string
    }[]
}

interface Order {
    index: number,
    extent: number, // 0-1
    element: Element
}

interface ElementMapping {
    index: number,
    extent: number,
    rank: number
}