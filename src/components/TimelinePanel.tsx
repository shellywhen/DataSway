import React, { useRef, useEffect, useState, FC } from 'react';
import { Timeline, TimelineEffect, TimelineRow, TimelineAction, TimelineState } from '@rakesh.rk1/react-timeline-editor';
import { store } from '@/store';
import { observer } from 'mobx-react';
import { Button, notification, Switch, Modal } from 'antd';
import { PlayCircleFilled, PauseCircleFilled, DownloadOutlined, ReloadOutlined, RocketOutlined, CopyOutlined } from '@ant-design/icons';
import { AnimeInstance } from 'animejs';
import { deepClone, getAnimationHandler, getAnimationScript } from '@/assets/animate';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TimelinePanelProps {
  version: Version | undefined,
  vidx: number | null
}

const CustomRender: FC<{ action: TimelineAction; row: TimelineRow; duration: number; offset: number}> =
  ({ action, row, duration, offset }) => {
    return (
      <div className={'timeline-effect'}>
        <div className={`timeline-effect-offset`} 
          style={{
            width:`${offset/(duration + offset + 0.0001) * 100}%`,
        }}></div>
        <div className={`timeline-effect-text`} style={{userSelect: 'none'}}>{`${action.id}`}</div>
      </div>
    );
  };

let dragCounter = 0;

export const TimelinePanel = observer(({version, vidx}: TimelinePanelProps) => {
  const [editorData, setEditorData] = useState<TimelineRow[]>([]);
  const [effects, setEffects] = useState<Record<string, TimelineEffect>>({});
  const [handler, setHandler] = useState<AnimeInstance | null>(null);
  const timelineRef = useRef<TimelineState|null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [script, setScript] = useState('');
  const [api, contextHolder] = notification.useNotification({
    placement: 'top',
})

  useEffect(() => {
    setHandler(null)
    if (!version) return;
    
    const timelineData = [];
    const effects = {} as Record<string, TimelineEffect>;
    // let timeAll = 0;
    for (let i = 0; i < version.snippets.length; i++) {
      const snippet = version.snippets[i];
      timelineData.push({
        id: `snippet-${i}`,
        actions: [{
          id: `${snippet.title}`,
          start: snippet.config.delay,
          end: snippet.config.delay + snippet.config.duration + snippet.config.offset,
          effectId: `snippet-effect-${i}`,
          flexible: true
        }]
      });
      // timeAll += snippet.config.duration
      effects[`snippet-effect-${i}`] = {
        id: `snippet-effect-${i}`,
        name: snippet.title,
      }
    }
      setEditorData(timelineData);
      setEffects(effects);
  } , [version, store.timelineFlag]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const updateConfigFromTimeline = (timelineData: TimelineRow[]) => {
    for (let i = 0; i < timelineData.length; i++) {
      const action = timelineData[i].actions[0];
      store.updateSnippet(i, { field: 'delay', value: action.start });
    }
    store.updateConfigFlag()

  }
  /** Verify that the spatial order has been properly set up */
  const checkStatus = () => {
    if (!store.CurSession?.versions[store.activeVersion]) {
      api.error({
        message: 'No valid version',
        description: 'Please select a version to animate'
      })
      return false;
    }
    const version = store.CurSession?.versions[store.activeVersion] as Version;
    for (const snippetIdx in version.snippets) {
        const snippet = version.snippets[snippetIdx];
        if (snippet.config.unit !== 'spatial') continue;
        const spatialType = snippet.config.spatial;
        if (spatialType === 'linear') {
          if (snippet.config.linear.start && snippet.config.linear.end) continue;
          api.error({
            message: 'Invalid spatial configuration: ' + snippet.title ,
            description: 'Please click twice for setting up the linear spatial configuration'
          })
          return false;
        }
        if (spatialType === 'spread') {
          if (snippet.config.spread.center) continue;
          api.error({
            message: 'Invalid spatial configuration: ' + snippet.title,
            description: 'Please set the center point for spread spatial configuration'
          })
          return false;
        }
        if (spatialType === 'sketch') {
          if (snippet.config.sketch.points.length > 1) continue;
          api.error({
            message: 'Invalid spatial configuration: ' + snippet.title,
            description: 'Please sketch on the visualization for spatial configuration'
          })
          return false;
        }
    }
    return true
  }

  const constructHandler = () => {
    const tickCallback = (anime: AnimeInstance) => {
      timelineRef.current?.setTime(anime.currentTime)
    }
    const startedCallback = (anime: AnimeInstance) => {
      // update the timeline data
        if (!anime.children) return;
        // const updatedTimelineData = deepClone(editorData);
        // let timeAll = 0;
        // anime.children?.forEach((child: AnimeInstance, cidx: number) => {
        //   // updatedTimelineData[cidx].actions[0].start = timeAll
        //   updatedTimelineData[cidx].actions[0].end = updatedTimelineData[cidx].actions[0].delay + child.duration
        //   timeAll += child.duration 
        // })
        // setEditorData(updatedTimelineData)
    }
    const version = store.CurSession?.versions[store.activeVersion] as Version;
    if (handler) handler.pause()
    const animeHandler = getAnimationHandler(version, tickCallback, startedCallback)
    setHandler(animeHandler)
    animeHandler.restart()
    timelineRef.current?.setTime(0)
    timelineRef.current?.listener.on('afterSetTime', ({time})=> {
      // trick to avoid the drag event being triggered too frequently
      dragCounter += 1;
      if (dragCounter % 20 !== 0) return
      if (store.isPlaying) return;
      animeHandler.seek(time)
    })

  }

    return <div style={{
       padding: '0vh 0vw .5vh .5vw'
    }}>
       { contextHolder }
    <div style={{
      borderTop: '1px solid #ECF5F2',
      backgroundColor: '#F5F9F8',
      padding: '0.5vh 1vw 0.5vh 1vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start'
    }}>
      <Button
       onClick={() => {
        if (!checkStatus()) return;
        store.setIsPlaying(true)
        store.addLog('Replay', {})
        constructHandler()
      }}> <RocketOutlined className="playerBtn" /> {handler ? 'Replay' : 'Animate'}</Button>
      &nbsp;&nbsp;

      
      <Button
       disabled={handler===null} 
       onClick={() => {
        store.setIsPlaying(true)
        store.addLog('Play', {})
        handler?.play()
      }}><PlayCircleFilled className="playerBtn" />Play</Button>
      &nbsp;&nbsp;

       <Button
       disabled={handler===null}
       onClick={() => {
        store.setIsPlaying(false)
        store.addLog('Pause', {})
        handler?.pause()
        timelineRef.current?.pause()
      }}><PauseCircleFilled className="playerBtn"/>Pause</Button>
        &nbsp;&nbsp;
        <Button
        onClick={()=>{
          timelineRef.current?.setTime(0)
          store.updateSvgFlag()
        }}
      ><ReloadOutlined className="playerBtn" />
        Recover
      </Button>


      &nbsp;&nbsp;
      <Button
       onClick={() => {
        setScript(getAnimationScript(store.CurSession?.versions[store.activeVersion] as Version))
        showModal()
      }}><DownloadOutlined  className="playerBtn"/>Export</Button>
      &nbsp;&nbsp;
      <Switch size="default" 
        value={version?.loop}
        checkedChildren="Loop"
        unCheckedChildren="Once"
        onChange={(checked) => {
          store.updateVersion(store.activeVersion, {
            field: 'loop',
            value: checked
          })
        }}
      />
    </div>
    <Timeline
        style={{
          width: '100%',
          borderRadius: 5
        }}
        getActionRender={(action, row) => {
          const idx = parseInt(row.id.split('-')[1])
          const snippet = store.Snippets[idx]
          if (!snippet) return <></>
          const duration = snippet.config.duration
          const offset = snippet.config.offset
          return <CustomRender action={action} row={row} duration={duration} offset={offset} />;
        }}
        editorData={editorData}
        effects={effects}
        ref={timelineRef}
        scale={1000}
        scaleSplitCount={20}
        dragLine={true}
        autoScroll={true}
        onActionResizing={({action, row, start, end, dir}) => {
          // const title = action.id
          // const idx = store.Snippets.findIndex((s) => s.title === title)
          if (dir !== 'right') return false
          const idx = parseInt(row.id.split('-')[1])
          if (idx === -1) return false;
          const snippet = store.Snippets[idx]
          if (end - start < snippet.config.offset) {
            return false;
          } else {
            store.updateSnippet(idx, { field: 'duration', value: end - start - snippet.config.offset })
            return true;
          }
        }}
        getScaleRender={(scale) => {
          return <div style={{
            color: '#4A4A4A',
            fontSize: 12
          }}>{scale/1000}s</div>
        }}
        onChange={updateConfigFromTimeline}
      />

      <Modal title={<>
        <Button type="text" onClick={()=>{
          navigator.clipboard.writeText(script)
      }}><CopyOutlined />&nbsp;Copy Animation Script &nbsp;</Button></>} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={'65vw'} height={'70vh'}>
      <div style={{
        overflowY: 'scroll',
        height: '60vh',
      }}> 
        <SyntaxHighlighter language="javascript" style={materialLight}>
          {script}
        </SyntaxHighlighter>
      </div>
     
      </Modal>
    </div>
})