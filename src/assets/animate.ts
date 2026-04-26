import anime from 'animejs/lib/anime.es.js';
import seedrandom from 'seedrandom';
import { Random, RNG } from 'random';
import { AnimeInstance, AnimeTimelineInstance } from 'animejs';
import { min } from 'd3';

const deepClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj))
}

/** Generate a random array of indices based on seed
 * @param seed random seed
 * @param total number of elements in the array
 * @returns 
 */

const getRandomArray = (seed: number, total: number) => {
    const rand = seedrandom(seed.toString()) as unknown as RNG
    const randGen = new Random(rand)
    const indexList = new Array(total).fill(0).map((_, i) => i)
    // Fisher-Yates shuffle
    for (let i = total - 1; i >= 0; i--) {
        const j = randGen.int(0, i) as number;
        [indexList[i], indexList[j]] = [indexList[j], indexList[i]] as [number, number];
    }
    return indexList
}

/**
 * @assumption dx and dy are not zero
 */
const getLinearEleMapping = (elePoints: Point[], _start: Point, _end: Point):ElementMapping[] => {
    // sort the elements based on their projection to the line defined by start and end
    // return the sorted element ids
    const svg = document.querySelector('.auxiliary-svg') as SVGSVGElement
    const svgRect = svg.getBoundingClientRect()
    const {width: svgWidth, height: svgHeight} = svgRect
    const viewBox = svg.getAttribute('viewBox')?.split(' ').map((v) => parseFloat(v)) as [number, number, number, number]
    const viewBoxW = viewBox[2]
    const viewBoxH = viewBox[3]
    // const elePoints = _elePoints.map((point) => {
    //    return {
    //     x: (point.x - viewBox[0]) / viewBoxW * svgWidth,
    //     y: (point.y - viewBox[1]) / viewBoxH * svgHeight
    //    }
    // })
    const start = {
        x: (_start.x - viewBox[0]) / viewBoxW * svgWidth,
        y: (_start.y - viewBox[1]) / viewBoxH * svgHeight
    }
    const end = {
        x: (_end.x - viewBox[0]) / viewBoxW * svgWidth,
        y: (_end.y - viewBox[1]) / viewBoxH * svgHeight
    }

    const idxList = elePoints.map((point, idx) => {
        const dx = end.x - start.x
        const dy = end.y - start.y
        const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
        return {idx, t}
    }).sort((a, b) => a.t - b.t).map((item, rank) => {
        return {
            index: item.idx,
            extent: item.t,
            rank
        }
    })
    // rescale to 0 to 1
    idxList.forEach((item) => {
        item.extent = (item.extent - idxList[0].extent) / (idxList[idxList.length - 1].extent - idxList[0].extent)
    })
    
    return idxList.sort((a, b) => a.index - b.index)
}

const distance = (pointA: Point, pointB: Point): number => {
    return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}

/** Project a point onto a line segment and return the closest point on the segment 
 * @assumption dx and dy are not zero
*/
const projectPointToSegment = (point: Point, segmentStart: Point, segmentEnd: Point): Point => {
    const AB = {
      dx: segmentEnd.x - segmentStart.x,
      dy: segmentEnd.y - segmentStart.y,
    };
    const AP = {
      dx: point.x - segmentStart.x,
      dy: point.y - segmentStart.y,
    };
    const ab2 = AB.dx * AB.dx + AB.dy * AB.dy;
    const ap_ab = AP.dx * AB.dx + AP.dy * AB.dy;
    let t = ap_ab / ab2;
    t = Math.max(0, Math.min(1, t)); // Clamp t to the segment [0, 1]
    return {
      x: segmentStart.x + t * AB.dx,
      y: segmentStart.y + t * AB.dy,
    };
}


/** Calculate cumulative distances along the sketchPoints polyline */
const calculateCumulativeDistances = (points: Point[]): number[] => {
    const distances: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      distances.push(distances[i - 1] + distance(points[i - 1], points[i]));
    }
    return distances;
}

const calculateAccumulatedProgress = (elePoints: Point[], _sketchPoints: Point[]) => {
    const svg = document.querySelector('.auxiliary-svg') as SVGSVGElement
    const svgRect = svg.getBoundingClientRect()
    const {width: svgWidth, height: svgHeight} = svgRect
    const viewBox = svg.getAttribute('viewBox')?.split(' ').map((v) => parseFloat(v)) as [number, number, number, number]
    const viewBoxW = viewBox[2]
    const viewBoxH = viewBox[3]
    const sketchPoints =_sketchPoints.map((point) => {
       return {
        x: (point.x - viewBox[0]) / viewBoxW * svgWidth,
        y: (point.y - viewBox[1]) / viewBoxH * svgHeight
       }
    })
    const colorList = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray']
    const randomColor = colorList[Math.floor(Math.random() * colorList.length)]
    // sketchPoints.forEach((p) => {
    //     const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    //     circle.setAttribute('cx', p.x.toString())
    //     circle.setAttribute('cy', p.y.toString())
    //     circle.setAttribute('r', '2')
    //     circle.setAttribute('fill', randomColor)
    //     svg.appendChild(circle)
    // })
    
    const progress: {dist: number, idx: number}[] = [];
    const cumulativeDistances = calculateCumulativeDistances(sketchPoints);
    for (const elePointIdx in elePoints) {
      const elePoint = elePoints[elePointIdx];

    //   const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    //     circle.setAttribute('cx', elePoint.x.toString())
    //     circle.setAttribute('cy', elePoint.y.toString())
    //     circle.setAttribute('r', '2')
    //     circle.setAttribute('fill', 'black')
    //     svg.appendChild(circle)

      let closestDistance = Infinity;
      let accumulatedDistance = 0;
      for (let i = 0; i < sketchPoints.length - 1; i++) {
        const projectedPoint = projectPointToSegment(elePoint, sketchPoints[i], sketchPoints[i + 1]);
        const distToProjected = distance(elePoint, projectedPoint);
        const distanceAlongPath = cumulativeDistances[i] + distance(sketchPoints[i], projectedPoint);
        if (distToProjected < closestDistance) {
          closestDistance = distToProjected;
          accumulatedDistance = distanceAlongPath;
        }
      }
      progress.push({
        dist: accumulatedDistance,
        idx: parseInt(elePointIdx),
    });
    }
    return progress;
  }

const getSketchEleMapping = (elePoints: Point[], sketchPoints: Point[]):ElementMapping[] => {
    const progressList = calculateAccumulatedProgress(elePoints, sketchPoints)
    const sortedProgressList = progressList.sort((a, b) => a.dist - b.dist)
    const minDist = sortedProgressList[0].dist
    const maxDist = sortedProgressList[sortedProgressList.length - 1].dist
    console.log(elePoints, sketchPoints, sortedProgressList, minDist, maxDist)
    return sortedProgressList.map((item, rank) => {
        return {
            index: item.idx,
            extent: (item.dist - minDist) / (maxDist - minDist + 0.00001),
            rank
        }
    }).sort((a, b) => a.index - b.index)

}

const getSpreadEleMapping = (elePoints: Point[], _center: Point):ElementMapping[] => {
    // sort the elements based on their distance to the center
    // return the sorted element ids
    const svg = document.querySelector('.auxiliary-svg') as SVGSVGElement
    const svgRect = svg.getBoundingClientRect()
    const {width: svgWidth, height: svgHeight} = svgRect
    const viewBox = svg.getAttribute('viewBox')?.split(' ').map((v) => parseFloat(v)) as [number, number, number, number]
    const viewBoxW = viewBox[2]
    const viewBoxH = viewBox[3]
    const center = {
        x: (_center.x - viewBox[0]) / viewBoxW * svgWidth,
        y: (_center.y - viewBox[1]) / viewBoxH * svgHeight
    }
    const sortedList = elePoints.map((point, index) => {
        const dx = point.x - center.x
        const dy = point.y - center.y
        return {index, r: Math.sqrt(dx * dx + dy * dy)}
    }).sort((a, b) => a.r - b.r)
    const maxRadius = sortedList[sortedList.length - 1].r
    return sortedList.map((item, rank: number) => {
        return {
            index: item.index, 
            extent: item.r / maxRadius,
            rank: rank
        }
    }).sort((a, b) => a.index - b.index)
}

const getSpatialEleMapping = (config: SnippetConfigProps, elements: Element[]) => {
    const order = config.spatial
    const svg = document.querySelector('.auxiliary-svg') as SVGSVGElement
    const svgRect = svg.getBoundingClientRect()

    const elePoints = elements.map((ele) => {
        const e = ele as SVGGraphicsElement
        const bbox = e.getBoundingClientRect()
        const rect = e.getBoundingClientRect()
        const centerX = rect.left + (bbox.width / 2) - svgRect.left;
        const centerY = rect.top + (bbox.height / 2) - svgRect.top;
        return { x: centerX, y: centerY }
    })
    let partialEleList = Array.from({length: elements.length}, (_, i) => {
        return {
            index: i,
            extent: i / elements.length,
            rank: i
        }
    }) as ElementMapping[]

    switch(order) {
        case 'linear':
            partialEleList = getLinearEleMapping(elePoints, config.linear.start!, config.linear.end! )
            break
        case 'spread':
            partialEleList = getSpreadEleMapping(elePoints, config.spread.center!)
            break
        case 'sketch':
            partialEleList = getSketchEleMapping(elePoints, config.sketch.points)
            break
    }
    return partialEleList
}

const getDataEleMapping = (config: SnippetConfigProps, elements: Element[]): ElementMapping[] => {
    // sort the elements based on their bbox size
    // return the sorted element ids
    const sortedList = elements.map((ele, index) => {
        const rect = (ele as SVGSVGElement).getBoundingClientRect()
        return {index, size: Math.sqrt(rect.width ** 2 + rect.height ** 2)}
        // return {index, size: rect.width * rect.height}
    }).sort((a, b) => a.size - b.size)
    const maxSize = sortedList[sortedList.length - 1].size
    const minSize = sortedList[0].size
    if (config.data.order === 'desc') {
        sortedList.reverse()
    }
    const res = sortedList.map((item, rank) => {
        const val_extent = (config.data.order === 'desc'? (maxSize - item.size):(item.size - minSize)) / (maxSize - minSize + 0.0001)
        const rank_extent = rank / elements.length
        const extent = config.data.rank ? rank_extent : val_extent
        console.log(item, extent)
        return {
            index: item.index,
            extent,
            rank
        }
    }).sort((a, b) => a.index - b.index)
    console.log(res)
    return res
}

const getEleMapping = (targets: string, config: SnippetConfigProps): ElementMapping[] => {
    const elements = Array.from(document.querySelectorAll(targets))
    switch(config.unit) {
        case 'spatial':
            return getSpatialEleMapping(config, elements)
        case 'random':
            return getRandomArray(config.randomSeed, elements.length).map((newIdx, idx) => {
                return {
                    rank: newIdx,
                    index: idx,
                    extent: newIdx / elements.length
                }
            })
        case 'data':
            return getDataEleMapping(config, elements)
        default:
            return elements.map((e, idx) => {
                return {
                    rank: idx,
                    index: idx,
                    extent: idx / elements.length
                }
            }); // occurance in the svg structure
    }
}

/**
 * @assumption The snippet config has been properly set
 * @returns anime timeline
 */
const getAnimationHandler = (version: Version, tickCallback: (instance: AnimeInstance)=>void = ()=>{}, startCallback: (instance: AnimeInstance)=>void = ()=>{}) => {
    const timeline = anime.timeline({
        autoplay: false,
        loop: version.loop,
        update: (anim) => {
            tickCallback(anim)
        },
        begin: (anim) => {
            startCallback(anim)
        }
    })
    version.snippets.forEach((snippet) => {
        const baseAnime = deepClone(snippet.obj) as unknown as anime.AnimeParams
        const config = deepClone(snippet.config)
        const orderedEles = getEleMapping(snippet.obj.targets, config)
        delete baseAnime.stagger
        delete baseAnime.loop
        baseAnime.delay = (_, idx) => {
            return config.delay + config.offset * (orderedEles[idx].extent)
        }
        // TO-DO: Compare targets as Element or string identifier
        // orderedEles.forEach((order, idx) => {
        //     const eleAniParam = { ...baseAnime }
        //     eleAniParam.targets = order.element
        //     eleAniParam.delay = snippet.config.offset * orderedEles.length * (order.extent)
        //     eleAniParam.endDelay = snippet.config.offset * orderedEles.length * (1 - order.extent)
        // })
        timeline.add(baseAnime ,'+0')
    })
    return timeline
}


const getAnimationScript = (version: Version): string => {
    const svg = document.querySelector('.auxiliary-svg') as SVGSVGElement
    const bbox = svg.getBoundingClientRect()
    const width = bbox.width
    const height = bbox.height
    const viewBox = svg.getAttribute('viewBox') || `0 0 ${width} ${height}`
    const dependancy = {
        keyframes: [],
        configs: [],
        svg: {
            width,
            height,
            viewBox,
            left: bbox.left,
            top: bbox.top
        }
    } as Record<string, any>
    version.snippets.forEach((snippet) => {
        const baseAnime = deepClone(snippet.obj) as unknown as anime.AnimeParams
        const config = deepClone(snippet.config)
        const orderedEles = getEleMapping(snippet.obj.targets, config)
        delete baseAnime.stagger
        delete baseAnime.loop
        baseAnime.duration = baseAnime.duration || 1000
        //dependancy.mapping.push(orderedEles)
        dependancy.keyframes.push(baseAnime) 
        dependancy.configs.push(config)
    })
    // TODO: Support dynamic dependency generation based on configuration file
    const script = `// include the \`animejs\`, \`seedrandom\`, \`chance\`, and our \`helper\` libraries in your project

const dependancy = ${JSON.stringify(dependancy, null, 2)}

// please call the function \`getTimeline(dependancy, document.querySelector('svg'))\`
`
    return script
}

export {
    getAnimationHandler,
    getAnimationScript,
    deepClone
}