import React, { useRef, useState, useEffect, ReactNode, CSSProperties } from 'react';
import { ArrowRightOutlined, AimOutlined, SignatureOutlined, DeleteOutlined, CheckOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import parse, { domToReact, HTMLReactParserOptions } from 'html-react-parser';
import * as _ from 'radash';
import { observer } from 'mobx-react';
import { store } from '@/store';
import { Button, Divider, Radio, Segmented, Space } from 'antd';
import { has, set } from 'mobx';

const LINE_COLOR = '#7B9FCB'
const DOT_COLOR = '#7B9FCB'

interface SvgLassoSelectionProps {
    svgString: string;
    svgStyle: string[];
    targetWidth?: number;
    targetHeight?: number;
    resize?: boolean;
    hasController?: boolean;
}

const defaultProps: SvgLassoSelectionProps = {
    svgString: '',
    svgStyle: [],
    targetWidth:500,
    targetHeight: 400,
    resize: true,
    hasController: false
};


function parseStyleString (styleString: string): CSSProperties {
    const lines = styleString.split(';')
    const style = lines.reduce((styleObject: CSSProperties, rule) => {
      const [property, value] = rule.split(':').map(item => item.trim());
      if (property) {
        const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) as keyof CSSProperties;
        styleObject[camelCaseProperty] = value;
      }
      return styleObject;
    }, {});
    return style;
  }



const SvgLassoSelection = observer(({ svgStyle, svgString, targetWidth, targetHeight, resize, hasController }: SvgLassoSelectionProps = defaultProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathElementRef = useRef<SVGPathElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lassoPath, setLassoPath] = useState('');
  const [svgWidth, setSvgWidth] = useState(500);
  const [svgHeight, setSvgHeight] = useState(400);
  const [svgStyleObject, setSvgStyleObject] = useState<React.CSSProperties>({});
  const [svgContent , setSvgContent] = useState<ReactNode|null>(null);
  const [viewBox, setViewBox] = useState<{x: number, y: number, width: number, height: number}>({x: 0, y: 0, width: 0, height: 0});
  const [viewBoxStr, setViewBoxStr] = useState('0 0 500 400');
  const [containerOffset, setContainerOffset] = useState<Point>({ x: 0, y: 0 });
  const [svgContainerID, setContainerId] = useState(_.uid(5));
  // auxiliary direct manipulation support
  const [startPoint, setStartPoint] = useState<null|Point>(null);
  const [endPoint, setEndPoint] = useState<null|Point>(null);
  const [targetPoint, setTargetPoint] = useState<null|Point>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [isShowingAuxiliary, setIsShowingAuxiliary] = useState(true);
  const [isConfigSpatial, setIsConfigSpatial] = useState(false);
  const [spatial, setSpatial] = useState('linear');

  useEffect(() => {
    setSvgContent(null)
    const content = parse(svgString, options) as unknown as React.ReactNode;
    setTimeout(() => {

      setSvgContent(content);
     
    }, 50)
  }, [svgString, store.svgFlag]);

  useEffect(()=>{
    if (svgRef.current) {
      const viewBox = svgRef.current.viewBox.baseVal;
      setViewBox(viewBox);
    }
    if (!store.CurSnippet) return;
    const config = store.CurSnippet.config;
    setStartPoint(config.linear.start);
    setEndPoint(config.linear.end);
    setTargetPoint(config.spread.center);
  },[])
  
  useEffect(() => {
    if (!store.CurSnippet) return;
    const config = store.CurSnippet.config;
    setStartPoint(config.linear.start);
    setEndPoint(config.linear.end);
    setTargetPoint(config.spread.center);
    setSpatial(config.spatial || 'linear');
  }, [store.activeSnippet])

  useEffect(() => {
    setIsConfigSpatial(store.CurSnippet?.config.unit === 'spatial');
    setSpatial(store.CurSnippet?.config.spatial || 'linear');
  }, [store.configFlag])

  const getMousePositionInSvg = (mouseX: number, mouseY: number) => {
    if (viewBox.height === 0 || viewBox.width === 0) return { x: mouseX, y: mouseY };
    const { x: viewBoxX, y: viewBoxY, width: viewBoxW, height: viewBoxH } = viewBox;
    const svgX = mouseX / svgWidth * viewBoxW + viewBoxX;
    const svgY = mouseY / svgHeight * viewBoxH + viewBoxY;
    return { x: svgX, y: svgY };
  }

  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
        if (!('name' in domNode) || domNode.name !== 'svg') return domNode;
        const { id, class: classAttr, width, height, style, ...rest } = domNode.attribs
        let originalWidth = parseInt(width, 10) as number;
        let originalHeight = parseInt(height, 10) as number;
        console.log(originalWidth, originalHeight, 'hey');
        if (isNaN(originalHeight)|| isNaN(originalWidth)) {
          // get the current svg element bounding rect size
          const svgElement = svgRef.current;
          if (svgElement) {
            originalWidth = svgElement.clientWidth;
            originalHeight = svgElement.clientHeight;
          } else {
            originalWidth = 500;
            originalHeight = 400;
          }
        }
        let finalWidth = originalWidth;
        let finalHeight = originalHeight;
        if (resize) {
            if (!('viewBox' in rest)) {
                rest.viewBox = `0 0 ${originalWidth} ${originalHeight}`;
                setViewBoxStr(`0 0 ${originalWidth} ${originalHeight}`);
                setViewBox({x: 0, y: 0, width: originalWidth, height: originalHeight});
            } else {
              setViewBoxStr(rest.viewBox);
              const viewBoxArr = rest.viewBox.split(' ').map((v) => parseInt(v, 10));
              setViewBox({x: viewBoxArr[0], y: viewBoxArr[1], width: viewBoxArr[2], height: viewBoxArr[3]});
            }
            const originalAspectRatio = originalWidth / originalHeight;
            const tarWidth = targetWidth ?? defaultProps.targetWidth as number;
            const tarHeight = targetHeight ?? defaultProps.targetHeight as number;
            let newWidth = tarWidth;
            let newHeight = tarWidth / originalAspectRatio;
            if (newHeight > tarHeight) {
                newHeight = tarHeight;
                newWidth = newHeight * originalAspectRatio;
            }
            console.log(originalAspectRatio, originalWidth, originalHeight, newWidth, newHeight, 'hey ap');
            setSvgWidth(newWidth);
            setSvgHeight(newHeight);
            finalWidth = newWidth;
            finalHeight = newHeight
        } else {
            setSvgWidth(originalWidth);
            setSvgHeight(originalHeight);
            finalWidth = originalWidth;
            finalHeight = originalHeight
        }
        const styleObject = parseStyleString(style || '');
        setSvgStyleObject(styleObject);
        return (
           <svg id={id} className={classAttr} {...rest} style={styleObject} width={finalWidth} height={finalHeight} ref={svgRef}>
            <style>{svgStyle.join('\n')}</style>
            { domToReact(domNode.children) }
           
          </svg>
        );
      }
    };


  const handleClick = (e: React.MouseEvent)=>{
    e.preventDefault();
    e.stopPropagation(); 
    if (store.CurSnippet === null) return;
    const containerRect = {x: containerRef.current?.offsetLeft, y: containerRef.current?.offsetTop} as Point;
    setContainerOffset(containerRect)
  
    if (store.CurSnippet === null) return;
    const mode = store.CurSnippet?.config.spatial
    if (mode === 'sketch') return;
    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;
    const {x, y} = getMousePositionInSvg(mouseX, mouseY) as {x: number, y: number};
    if (mode === 'linear') {
      if (startPoint === null) {
        setStartPoint({x, y});
        store.updateSpatialConfig('linear', {start: {x, y}, end: null});
      } else if (endPoint === null) {
        // line is drawn
        setEndPoint({x, y});
        store.addLog('Linear', {start: startPoint, end: {x, y}});
        store.updateSpatialConfig('linear', {start: startPoint, end: {x, y}});
      } else {
        setStartPoint({x, y});
        setEndPoint(null);
        store.updateSpatialConfig('linear', {start: {x, y}, end: null});
      }
    } else if (mode === 'spread') {
      setTargetPoint({x, y});
      // spread is drawn
      store.addLog('Spread', {center: {x, y}});
      store.updateSpatialConfig('spread', {x, y});
    }
}


const handleMouseDown = (e: React.MouseEvent) => {
  setIsDrawing(true);
  const startX = e.nativeEvent.offsetX;
  const startY = e.nativeEvent.offsetY;
  const containerRect = {x: containerRef.current?.offsetLeft, y: containerRef.current?.offsetTop} as Point;
  setContainerOffset(containerRect);
  const { x, y } = getMousePositionInSvg(startX, startY);
  const newLassoPath = `M${x},${y}`;
  setLassoPath(newLassoPath);
  setLassoPoints([{ x, y }]);
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDrawing) return;
  const nextX = e.nativeEvent.offsetX;
  const nextY = e.nativeEvent.offsetY;
  const { x, y } = getMousePositionInSvg(nextX, nextY);
  const updatedLassoPath = `${lassoPath} L${x},${y}`;
  setLassoPoints([...lassoPoints, {x, y}]);
  setLassoPath(updatedLassoPath);
  if (pathElementRef.current) {
    pathElementRef.current.setAttribute('d', updatedLassoPath);
  }
};

const handleMouseUp = () => {
  setIsDrawing(false);
  if(!pathElementRef.current) return;
  if (pathElementRef.current) {
    const closedLassoPath = `${lassoPath}`;
    pathElementRef.current.setAttribute('d', closedLassoPath);
    // lasso is drawn
    if (store.CurSnippet?.config.spatial === 'sketch')
    store.addLog('Sketch', {lassoPoints});
    store.updateSpatialConfig('sketch', lassoPoints);
  }
};

  return (
    <div
      ref={containerRef}
      className='svg-container'
      id={svgContainerID}
      style={{
        position: 'relative',
        width: `100%`,
      }}
    >
       <div className='svg-overlay-wrapper' style={{
            position: 'relative',
            width: `${svgWidth}px`,
            margin: 'auto',
            height: `${svgHeight}px`
          }}>
       { svgContent }

       {hasController && <svg className="auxiliary-svg" 
          viewBox={viewBoxStr}
          height={svgHeight}
          width={svgWidth}
          style={{
          display: isShowingAuxiliary ? '': 'none',
        }}>
        <defs>
          <marker id="auxiliary-arrowhead" markerWidth="15" markerHeight="8" 
                  refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={LINE_COLOR} />
          </marker>
          <marker id="auxiliary-arrowhead2" markerWidth="18" markerHeight="8" 
                  refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={'lightgray'} />
          </marker>
          <filter id="auxiliary-dropShadow" x="0" y="0" width="200%" height="200%">
            <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="black" floodOpacity="0.5"/>
        </filter>
        <linearGradient id="auxiliary-linearGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#FF0000', stopOpacity: 1 }} /> 
            <stop offset="16.67%" style={{ stopColor: '#FF7F00', stopOpacity: 1 }} /> 
            <stop offset="33.33%" style={{ stopColor: '#FFbb00', stopOpacity: 1 }} /> 
            <stop offset="50%" style={{ stopColor: '#00FF00', stopOpacity: 1 }} />  
            <stop offset="66.67%" style={{ stopColor: '#0000FF', stopOpacity: 1 }} />
            <stop offset="83.33%" style={{ stopColor: '#4B0082', stopOpacity: 1 }} /> 
            <stop offset="100%" style={{ stopColor: '#8B00FF', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <g className="config-sptial-layer" style={{
                visibility: store.CurSnippet?.config.unit === 'spatial'?'visible':'hidden'
            }}>
            { (store.CurSnippet && (!store.isBaseline)) && <>
              <g className="config-sketch-layer"
                style={{display: store.CurSnippet?.config.spatial === 'sketch'? '': 'none'}}
              >
                { store.CurSnippet?.config.sketch.points.map((point, idx) => {
                    return <circle key={idx} cx={point.x} cy={point.y} r="1" fill={DOT_COLOR}></circle>
                  })
                }
                 <path className="auxiliary auxiliary-lasso" fill="none" strokeWidth={3} strokeDasharray="5" ref={pathElementRef} stroke={LINE_COLOR} markerEnd="url(#auxiliary-arrowhead)" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <g className='config-linear-layer' style={{display: store.CurSnippet?.config.spatial === 'linear'? '': 'none'}}>
                { (startPoint !== null) && (endPoint !== null) ? <line x1={startPoint.x} y1={startPoint.y} x2={endPoint.x} y2={endPoint.y} strokeWidth={2} strokeDasharray={5} stroke={LINE_COLOR} markerEnd="url(#auxiliary-arrowhead)"/>: null}
                { (startPoint!== null) ? <circle className="auxiliary-start" cx={startPoint.x} cy={startPoint.y} r="5" fill={DOT_COLOR}/> : null}
                { (endPoint !== null) ? <circle className="auxiliary-end" cx={endPoint.x} cy={endPoint.y} r="2" fill={DOT_COLOR}/>: null}
              </g>
              <g className='config-spread-layer' style={{display: store.CurSnippet?.config.spatial === 'spread'? '': 'none'}}>
                { targetPoint ? <>
                  <circle className="auxiliary" cx={targetPoint.x} cy={targetPoint.y} r="5" fill={DOT_COLOR} filter="url(#auxiliary-dropShadow)"/>
                  <circle className="auxiliary auxiliary-1" cx={targetPoint.x} cy={targetPoint.y} r="100" fill="none" strokeOpacity={0.7} strokeWidth={2} stroke={LINE_COLOR} filter="url(#auxiliary-dropShadow)"/>
                  <circle className="auxiliary auxiliary-2" cx={targetPoint.x} cy={targetPoint.y} r="200" fill="none" strokeOpacity={0.4} strokeWidth={2} stroke={LINE_COLOR} filter="url(#auxiliary-dropShadow)"/>
                  <circle className="auxiliary auxiliary-3" cx={targetPoint.x} cy={targetPoint.y} r="300" fill="none" strokeOpacity={0.2} strokeWidth={2} stroke={LINE_COLOR} filter="url(#auxiliary-dropShadow)"/>
                </> : null}
        
              </g>
              <rect x="0" 
                y="0" 
                width={viewBox.width || 1} 
                height={viewBox.height || 1} 
                fill="white" 
                opacity={0} 
                stroke="none" 
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            </>}
            </g>
        </svg>
    }
       </div>

      

     
      { (hasController && isConfigSpatial && (!store.isBaseline))&& <div>
      
        <div 
          className={`auxiliary-controller-${store.configFlag}`}
          style={{
            position: 'absolute',
            bottom: '50px',
            right: '10px',
            zIndex: 100,
            padding: '4px'
          }}>
          <Segmented
          size='middle'
          className="vertical-segmented"
          style={{
            transform: 'rotate(90deg) translateX(-80%) translateY(-50px)',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
          }}
          options={[
            { label: '', value: 'linear', icon: <ArrowRightOutlined rotate={-135}/> },
            { label: '', value: 'spread', icon: <AimOutlined/> },
            { label: '', value: 'sketch', icon: <SignatureOutlined rotate={-90}/>}
          ]}
          value={ spatial }
          onClick={(e)=>{
            e.stopPropagation();
          }}
          onChange={(v)=> {
            setSpatial(v)
            store.updateSnippet(store.activeSnippet, {
                field: 'spatial',
                value: v
              }
            )
          }}
        />

        <Space size={1} direction="vertical" >
          <Button type='text' size="small" value={''} onClick={(e)=>{
            e.stopPropagation();
            setIsShowingAuxiliary(!isShowingAuxiliary);
          }}>{isShowingAuxiliary?<EyeOutlined/>:<EyeInvisibleOutlined/>}</Button>
            </Space>


        </div>
      </div>}
    </div>
   
  );
});

export default SvgLassoSelection;