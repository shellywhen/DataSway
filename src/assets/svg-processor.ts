/**
 * Traverse the SVG tree and remove irrelevant attributes simplify the path
 * @param node '
 * @param simplifyPath
 */
const _depthFirstTraversal = (node: SVGElement, simplifyPath: boolean = false) => {
    node.childNodes.forEach((child) => {
        const c = child as SVGElement;
        if (c.nodeType !== Node.ELEMENT_NODE) return  // ensure it's an element node
        const tagName = c.tagName.toLowerCase();
        if (tagName === 'style') {
            c.textContent = '';
            return
        }
        if (tagName === 'path' && simplifyPath) {
            c.removeAttribute('d');
        }
        if (tagName === 'defs') {
            c.remove();
            return;
        }
        _depthFirstTraversal(child as SVGElement);
    });
  }
  
 /**SVG simplification for reducing tokens: remove render-irrelevant attributes */ 
const mid_simplify = (svg: string, simplyPath: boolean=false) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgRoot = doc.documentElement as unknown as SVGElement;
    _depthFirstTraversal(svgRoot, simplyPath);
    const cleanSvg = new XMLSerializer().serializeToString(svgRoot);
    return cleanSvg;
}

 /** SVG simplification for reducing tokens: sample data elements */ 
const high_simplify = (svg: string, topN:number=5, sampleRate: number=0.5) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const classInstances = new Map<string, number>();
    const svgRoot = doc.documentElement as unknown as SVGElement;
    const elements = svgRoot.querySelectorAll('[class]');
    elements.forEach((ele) => {
        const classes = (ele as SVGElement).getAttribute('class')?.split(' ') ?? [];
        classes.forEach((cls) => {
            if (classInstances.has(cls)) {
                classInstances.set(cls, classInstances.get(cls)! + 1);
            } else {
                classInstances.set(cls, 1);
            }
        });
    });
    // get the top N most frequent classes and filter based on the sample rate
    const sortedClasses = Array.from(classInstances.entries()).sort((a, b) => b[1] - a[1]);
    const topClasses = sortedClasses.slice(0, topN).map((cls) => cls[0]);
    elements.forEach((ele) => {
        const classes = (ele as SVGElement).getAttribute('class')?.split(' ') ?? [];
        const shouldRemove = classes.some((cls) => topClasses.includes(cls)) && Math.random() < sampleRate;
        if (shouldRemove) {
            ele.remove();
        }
    });
    const cleanSvg = new XMLSerializer().serializeToString(svgRoot);
    return cleanSvg;

}

const getScreenshotBlob = async(canvasId: string, download: boolean=false) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return '';
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    const url = URL.createObjectURL(blob as Blob);
    if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${canvasId}.png`;
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } else {
        return url;
    }
}

const getDataURL = (svg: SVGElement, download: boolean=false) => {
    if (!svg) return new Promise(resolve => resolve(''));
    // render into canvas and get the dataURL
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Promise(resolve => resolve(''));
    return new Promise((resolve, reject) => {
        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = function () {
            canvas.width = svg.clientWidth;
            canvas.height = svg.clientHeight;
            ctx.drawImage(img, 0, 0);
            const imageBase64 = canvas.toDataURL('image/png') as string;
            resolve(imageBase64);
            if (!download) return;
            const a = document.createElement('a');
            a.href = imageBase64;
            a.download = 'image.png';
            a.click();
            a.remove();
          URL.revokeObjectURL(url);
        };
        img.onerror = function (err) {
          console.log(err, 'error');
          reject(new Error('Failed to load image'));
          URL.revokeObjectURL(url);
        };
        img.src = url;
    });
}

export {
    getScreenshotBlob,
    mid_simplify,
    high_simplify,
    getDataURL
}