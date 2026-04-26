import { BASE_URL, SnippetConfig } from "@/assets/constant";
import { dreamDemo, cdDemo } from "@/assets/sessions";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { uid } from 'radash';

export class Store {
  sessions: UserSession[] = [dreamDemo, cdDemo];
  curSessionId: string | null = 'Demo: Dream';
  isSideBarCollapsed = false;
  token = 'OPEN AI API Token';
  screenshotId = '';
  screenshotSignal = 0;
  screenshotBlob = null;
  svgFlag = 0;
  timelineFlag = 0;
  configFlag = 0;
  chatboxFlag = 0;
  rightPanelPixel = 0;
  isLoading = false;  // requesting OpenAI API
  activeVersion = 0; // activated code version
  activeSnippet = 0; // activated code snippet
  isPlaying = false; // playing animation
  isBaseline = false;  // is baseline mode
  isUserStudy = false; // is user study mode
  _script = '';  // activated script in the baseline mode
  _name = '';  // participant name for user study

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "CanvasStore",
      properties: ["sessions", "curSessionId", "isSideBarCollapsed", "token", "activeVersion", "activeSnippet", "isPlaying", "curSessionId", "isBaseline", "_script", "_name"],
      storage: window.localStorage,
    });
  }

  // computed
  get CurSession() {
    return this.sessions.find((s) => s.id === this.curSessionId);
  }

  get code() {
    return this.CurSession?.code || "";
  }

  get Snippets() {
    const session = this.CurSession
    if (!session) return [] as Snippet[];
    if (!session.versions.length) return [] as Snippet[];
    if (!session.versions[this.activeVersion]) return [] as Snippet[];
    return session.versions[this.activeVersion].snippets
  }

  get Messages() {
    if (this.isBaseline) return this.CurSession?._messages || [];
    return this.CurSession?.messages || [];
  }

  get MouseMode() {
    if (!this.CurSession || this.Snippets.length == 0) return 'undefined';

  }

  get CurSnippet(): Snippet | null {
    if ((this.CurSession == null) || (this.activeSnippet == null)) return null;
    return this.Snippets[this.activeSnippet];
  }

  get Logs(): LogProps[][] {
    return this.sessions.map((s) => s.log);
  }

  setToken(token: string) {
    this.token = token;
  }

  setSnippetCode(idx: number, code: string) {
    if (!this.CurSession) return;
    this.CurSession.versions[this.activeVersion].snippets[idx].code = code;
  }

  setIsLoading (isload: boolean) {
    this.isLoading = isload
  }

  setIsBaseline(isBaseline: boolean) {  
    this.isBaseline = isBaseline;
    if (!isBaseline) this._script = '';
  }

  setCurSession(id: string) {
    this.curSessionId = id;
    this.activeSnippet = 0;
    this.activeVersion = Math.max(0, this.CurSession!.versions.length - 1);
  }

  setAciveVersion(vidx: number) {
    this.activeVersion = vidx;
    this.activeSnippet = 0;
  }

  setActiveSnippet(sidx: number) {
    this.activeSnippet = sidx;
  }

  setIsPlaying(isPlaying: boolean) {
    this.isPlaying = isPlaying;
    if (!isPlaying) {
      return;
    }
  }

  setRightPanelPixel(pixel: number) {
    this.rightPanelPixel = pixel;
  }

  updateSvgFlag() {
    this.svgFlag ++
  }

  updateTimelineFlag() {
    this.timelineFlag ++
  }

  updateConfigFlag() {
    this.configFlag ++
  }

  updateSnippet(idx: number, options: {field: keyof SnippetConfigProps, value: any}) {
    if (!this.CurSession) return;
    this.CurSession.versions[this.activeVersion].snippets[idx].config[options.field]=options.value;
    console.log(options.field, options.value, this.CurSession.versions[this.activeVersion].snippets[idx].config[options.field])
    if(['duration', 'offset', 'delay'].includes(options.field)) this.updateTimelineFlag();
    if (['unit'].includes(options.field)) {
      this.updateConfigFlag()
    }
  }

  updateSnippetObj(idx: number, obj: any) {
    if (!this.CurSession) return;
    this.CurSession.versions[this.activeVersion].snippets[idx].obj = obj;
    this.CurSession.versions[this.activeVersion].snippets[idx].code = JSON.stringify(obj, null, 2);
  }

  updateSession(sidx: number, options: {field: keyof UserSession, value: any}) {
    this.sessions[sidx][options.field] = options.value;
  }

  updateVersion(vidx: number, options: {field: keyof Version, value: any}) {
    this.CurSession.versions[vidx][options.field] = options.value;
  }

  setScript(script: string) {
    this._script = script;
  }

  add_Version(_script: stirng) {
    this.CurSession!._versions.push(_script);
  }

  setName(name: string) {
    this._name = name;
  }

  updateSpatialConfig (type: string, value: any) {
    if (!this.CurSnippet) return;
    if (type === 'spread') {
      this.CurSnippet.config.spread.center = value;
    } else if (type === 'sketch') {
      this.CurSnippet.config.sketch.points = value;
    } else if (type === 'linear') {
      this.CurSnippet.config.linear.start = value.start;
      this.CurSnippet.config.linear.end = value.end;
    }
  }


  async initSession(config: ExampleProps, isDev: boolean = false) {
    this.isBaseline = false;
    try {
      const prefix = BASE_URL + 'examples/' + config.folder + '/';
      const svg = await fetch(prefix+config.svgFile).then((res) => res.text());
      const styles = await Promise.all(config.styleFiles.map((style) => fetch(prefix+style).then((res) => {
        return res.text()}
      )));
      const newSession = {
        id: uid(6),
        log: [],
        code: isDev ? config.script : "",
        styles: styles,
        svg: svg,
        versions: isDev ? config.versions : [],
        _versions: [],
        messages: isDev ? config.messages : [],
        fileList: [{
          uid: '1',
          name: config.svgFile,
          status: 'done',
          url: prefix+config.svgFile,
        }, ...config.styleFiles.map((style, idx) => {
          return {
            uid: `${idx+2}`,
            name: style,
            status: 'done',
            url: prefix+style,
          }})],
        schema: {},
        data: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _messages: [],
      } as UserSession;
      this.sessions.unshift(newSession);
      this.curSessionId = newSession.id;
      this.activeSnippet = 0;
      this.activeVersion = 0;
    } catch (e) {
      console.error(e);
    }
  }

  deleteSession(id: string) {
    if (this.sessions.length === 1) return;
    this.sessions = this.sessions.filter((s) => s.id !== id);
    if (this.curSessionId === id) {
      this.curSessionId = this.sessions[0].id;
    }
  }

  addLog(type: string, options: any={}) {
    if (!this.isUserStudy) return;
    this.CurSession!.log.push({
      type: type,
      time: new Date().toISOString(),
      ...options
    });
  }

  addMessage(role: 'user' | 'assistant', content: string, options:any={}) {
    this.CurSession!.updated_at = new Date().toISOString();
    if (this.isBaseline) {
      this.CurSession!._messages.push({
        role: role,
        content: content,
        ...options
      });
      return;
    }
    this.CurSession!.messages.push({
      role: role,
      content: content,
      ...options
    });
  }

  addVersion(v: VersionMsg) {
    const vid = this.CurSession!.versions.length;
    if (v.animation.length === 0) return false;
    // let totalDuration = 1000;

    const version = {
      id: vid,
      snippets: v.animation.map((unit) => {
        // const keyframe = unit.keyframe;
        // let clipDuration = 1000
        // Object.keys(keyframe).forEach((key) => {
        //   const fieldDuration = 0
        //   const value = keyframe[key];
        //   if (typeof value === 'object') {
        //     if (!value.length) return;
        //     let kfDuration = 0;
        //     for (let i = 0; i < value.length; i++) {
        //       if ('duration' in value[i]) {
        //         clipDuration = Math.max(clipDuration, value[i].duration);
        //       }
        //     }
        //     const maxDuration = Math.max(...value.map((v) => v.duration));
        //   }
        // })
        const s = {
          code: `${JSON.stringify(unit.keyframe, null, 2)}`,
          obj: unit.keyframe,
          description: unit.elaboration,
          title: unit.title,
          config: new SnippetConfig()
        } as Snippet
        return s
        }),
      loop: false,
      duration: 1000,
    }
    this.CurSession!.versions.push(version);
    this.activeVersion = vid;
    return true;
  }

  addBaselineMessage(role: 'user' | 'assistant', content: string, options:any={}) {
    this.CurSession!.updated_at = new Date().toISOString();
    this.CurSession!._messages.push({
      role: role,
      content: content,
      ...options
    });
  }

  appendLastMessage(res: Record<string, any>) {
    if (!this.CurSession) return;
    const lastMessage = this.CurSession.messages[this.CurSession.messages.length - 1];
    if (lastMessage.role === 'assistant') {
      if ('isValid' in res) {
        const qa = res as QAMsg;
        lastMessage.isValid = qa.isValid;
        lastMessage.explanation = qa.explanation;
      }
    }
    this.chatboxFlag ++;
  }



}
export const store = new Store();
