export const HOST = "http://localhost:1234/";

/** Same as Vite `base` (always ends with `/`). Keeps asset URLs and React Router in sync. */
export const BASE_URL = import.meta.env.BASE_URL;

export const uiToken =  {
    token: {
    colorPrimary: '#37916b',
    colorLink: '#7cbd7c',
    colorLinkActive: '#afd0af'
  } 
}

export class LinearOrder implements LinearOrderProps {
  constructor() {
      this.start = null;
      this.end = null;
      this.isReady = false;
      this.order = [];
  }
  start: Point | null;
  end: Point | null;
  isReady: boolean;
  order: number[];
}

export class SpreadOrderProps {
  constructor() {
      this.center = null;
      this.isReady = false;
      this.order = [];
  }
  center: Point | null;
  isReady: boolean;
  order: number[];
}

export class SketchOrderProps {
  constructor() {
      this.points = [];
      this.isReady = false;
      this.order = [];
  }
  points: Point[];
  isReady: boolean;
  order: [];
}

export class SnippetConfig implements SnippetConfigProps {
  constructor() {
      this.unit = 'occurance';
      this.spatial = 'linear';
      this.linear = new LinearOrder();
      this.spread = new SpreadOrderProps();
      this.sketch = new SketchOrderProps();
      this.data = {
          order: 'asc',
          rank: false
      }
      this.randomSeed = 0;
      this.delay = 0;
      this.offset = 0;
      this.duration =1000;
  }
  unit: "spatial" | "occurance" | "random";
  spatial: "linear" | "spread" | "sketch" | null;
  linear: LinearOrderProps;
  spread: SpreadOrderProps;
  sketch: SketchOrderProps;
  randomSeed: number;
  delay: number;
  offset: number;
  duration: number;
  data: DataOrderProps;
}

export class Version implements Version {
  constructor(id: number) {
      this.id = id;
      this.snippets = [];
      this.loop = false;
      this.duration = 0;
  }
  id: number;
  snippets: Snippet[];
  loop: boolean;
  duration: number;
}


const GALLERY_LIST = [
  {
      preview: 'Ex1. CD Sales.gif',
      title: 'CD Sales',
      description: 'A simple bar chart showing CD sales by genre.',
      

  }
]

