const EPS = 1e-6
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

const getRandomArray = (seed, total) => {
    Math.seedrandom(seed.toString());
    const chance = new Chance(seed);
    const indexList = new Array(total).fill(0).map((_, i) => i)
    for (let i = total - 1; i >= 0; i--) {
        const j = chance.integer({ min: 0, max: i });
        [indexList[i], indexList[j]] = [indexList[j], indexList[i]];
    }
    return indexList
}

const getLinearEleMapping = (elePoints, _start, _end, svgProfile, svgEle) => {
    const { width: svgWidth, height: svgHeight, viewBox: svgViewBox } = svgProfile
    const viewBox = svgViewBox.split(' ').map((v) => parseFloat(v))
    const viewBoxW = viewBox[2]
    const viewBoxH = viewBox[3]
    const original_start = {
        x: (_start.x - viewBox[0]) / viewBoxW * svgWidth,
        y: (_start.y - viewBox[1]) / viewBoxH * svgHeight
    }
    const original_end = {
        x: (_end.x - viewBox[0]) / viewBoxW * svgWidth,
        y: (_end.y - viewBox[1]) / viewBoxH * svgHeight
    }
    const curSvgBbox = svgEle.getBoundingClientRect()
    const curSvgWidth = curSvgBbox.width
    const curSvgHeight = curSvgBbox.height

    const start = {
        x: original_start.x / svgWidth * curSvgWidth,
        y: original_start.y / svgHeight * curSvgHeight
    }
    const end = {
        x: original_end.x / svgWidth * curSvgWidth,
        y: original_end.y / svgHeight * curSvgHeight
    }

    const idxList = elePoints.map((point, idx) => {
        const dx = end.x - start.x
        const dy = end.y - start.y
        const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
        return { idx, t }
    }).sort((a, b) => a.t - b.t).map((item, rank) => ({ index: item.idx, extent: item.t, rank }))

    idxList.forEach((item) => {
        item.extent = (item.extent - idxList[0].extent) / (idxList[idxList.length - 1].extent - idxList[0].extent)
    })

    return idxList.sort((a, b) => a.index - b.index)
}

const distance = (pointA, pointB) => {
    return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}

const projectPointToSegment = (point, segmentStart, segmentEnd) => {
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
    t = Math.max(0, Math.min(1, t));
    return {
        x: segmentStart.x + t * AB.dx,
        y: segmentStart.y + t * AB.dy,
    };
}

const calculateCumulativeDistances = (points) => {
    const distances = [0];
    for (let i = 1; i < points.length; i++) {
        distances.push(distances[i - 1] + distance(points[i - 1], points[i]));
    }
    return distances;
}

const calculateAccumulatedProgress = (elePoints, _sketchPoints, svgProfile, svgEle) => {
    const { width: svgWidth, height: svgHeight, viewBox: svgViewBox, left: svgLeft, top: svgTop } = svgProfile
    const viewBox = svgViewBox.split(' ').map((v) => parseFloat(v))
    const viewBoxW = viewBox[2]
    const viewBoxH = viewBox[3]
    const curSvgBbox = svgEle.getBoundingClientRect()
    const curSvgWidth = curSvgBbox.width
    const curSvgHeight = curSvgBbox.height

    const colorList = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black', 'gray']
    const randomColor = colorList[Math.floor(Math.random() * colorList.length)]

    const sketchPoints = _sketchPoints.map((point) => {
        const _x = (point.x - viewBox[0]) / viewBoxW * svgWidth 
        const _y = (point.y - viewBox[1]) / viewBoxH * svgHeight
        const x = _x / svgWidth * curSvgWidth
        const y = _y / svgHeight * curSvgHeight
        // const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        // circle.setAttribute('cx', x);
        // circle.setAttribute('cy', y);
        // circle.setAttribute('r', 5);
        // circle.setAttribute('fill', randomColor);
        // svgEle.appendChild(circle);
        return {
            x,
            y,
        }
    })


    const progress = [];
    const cumulativeDistances = calculateCumulativeDistances(sketchPoints);
    for (const elePointIdx in elePoints) {
        const elePoint = elePoints[elePointIdx];
        // const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        // circle.setAttribute('cx', elePoint.x);
        // circle.setAttribute('cy', elePoint.y);
        // circle.setAttribute('r', 5);
        // circle.setAttribute('fill', 'black');
        // svgEle.appendChild(circle);

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

const getSketchEleMapping = (elePoints, sketchPoints, svgProfile, svgEle) => {
    const progressList = calculateAccumulatedProgress(elePoints, sketchPoints, svgProfile, svgEle)
    const sortedProgressList = progressList.sort((a, b) => a.dist - b.dist)
    const minDist = sortedProgressList[0].dist
    const maxDist = sortedProgressList[sortedProgressList.length - 1].dist
    return sortedProgressList.map((item, rank) => ({
        index: item.idx,
        extent: (item.dist - minDist) / (maxDist - minDist + EPS),
        rank
    })).sort((a, b) => a.index - b.index)
}

const getSpreadEleMapping = (elePoints, _center, svgProfile, svgEle) => {
    const curSvgBbox = svgEle.getBoundingClientRect()

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', _center.x);
    circle.setAttribute('cy', _center.y);
    circle.setAttribute('r', 0);
    circle.setAttribute('fill', 'white');
    circle.setAttribute('opacity', 1);
    svgEle.appendChild(circle);

    const curLocation = circle.getBoundingClientRect()
    const center = {
        x: curLocation.left - curSvgBbox.left,
        y: curLocation.top - curSvgBbox.top
    }

    const sortedList = elePoints.map((point, index) => {
        const dx = point.x - center.x
        const dy = point.y - center.y
        return { index, r: Math.sqrt(dx * dx + dy * dy) }
    }).sort((a, b) => a.r - b.r)
    const maxRadius = sortedList[sortedList.length - 1].r

    circle.remove()
    return sortedList.map((item, rank) => ({
        index: item.index,
        extent: item.r / maxRadius,
        rank
    })).sort((a, b) => a.index - b.index)
}

const getSpatialEleMapping = (config, elements, svgProfile, svgEle) => {
    const order = config.spatial;
    const svgRect = svgEle.getBoundingClientRect();
    const elePoints = elements.map((ele) => {
        const e = ele;
        const rect = e.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2) - svgRect.left;
        const centerY = rect.top + (rect.height / 2) - svgRect.top;
        return { x: centerX, y: centerY };
    });

    let partialEleList = Array.from({ length: elements.length }, (_, i) => ({
        index: i,
        extent: i / elements.length,
        rank: i
    }));

    switch (order) {
        case 'linear':
            partialEleList = getLinearEleMapping(elePoints, config.linear.start, config.linear.end, svgProfile, svgEle);
            break;
        case 'spread':
            partialEleList = getSpreadEleMapping(elePoints, config.spread.center, svgProfile, svgEle);
            break;
        case 'sketch':
            partialEleList = getSketchEleMapping(elePoints, config.sketch.points, svgProfile, svgEle);
            break;
    }
    return partialEleList;
}

const getDataEleMapping = (config, elements) => {
    const sortedList = elements.map((ele, index) => {
        const rect = ele.getBoundingClientRect();
        return { index, size: Math.sqrt(rect.width ** 2 + rect.height ** 2) };
    }).sort((a, b) => a.size - b.size);

    const maxSize = sortedList[sortedList.length - 1].size;
    const minSize = sortedList[0].size;
    if (config.data.order === 'desc') {
        sortedList.reverse();
    }

    const res = sortedList.map((item, rank) => {
        const val_extent = (config.data.order === 'desc' ? (maxSize - item.size) : (item.size - minSize)) / (maxSize - minSize + 0.0001);
        const rank_extent = rank / elements.length;
        const extent = config.data.rank ? rank_extent : val_extent;
        return {
            index: item.index,
            extent,
            rank
        };
    }).sort((a, b) => a.index - b.index);
    return res;
}

const getEleMapping = (targets, config, svgProfile, svgEle) => {
    const elements = Array.from(document.querySelectorAll(targets))
    switch (config.unit) {
        case 'spatial':
            return getSpatialEleMapping(config, elements, svgProfile, svgEle)
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



const getTimeline = (spec, svgEle, needLoop=true) => {
    const timeline = anime.timeline({
        autoplay: false,
        loop: needLoop
    });
    spec.keyframes.forEach((kf, idx) => {
        const config = spec.configs[idx]
        const targetIdentifier = kf.targets
        const eleMapping = getEleMapping(targetIdentifier, config, spec.svg, svgEle)
        const baseAnimation = kf
        baseAnimation.duration = config.duration
        baseAnimation.delay = (_, idx) => {
            return config.delay + config.offset * eleMapping[idx].extent
        }
        timeline.add(baseAnimation, '+0')

    })
    return timeline
}