import React, { Children, useEffect, useRef, useState } from 'react';
import { Button, Col, Row, Tabs } from 'antd';
import { observer } from 'mobx-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeEditor from './CodeEditor';
import SnippetEditor from './SnippetEditor';
import { store } from '@/store';
import { ButtonToken } from 'antd/es/button/style/token';
import SnippetController from './SnippetController';

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;


const getTabItemChildren = (snippet: Snippet, snippetIdx: number) => {
    return <div style={{
        minHeight: '60vh',
        height: '60vh'
    }}>
    <PanelGroup autoSaveId="tab-panel-layout" direction="vertical">
        <Panel defaultSize={50}>
        <Row align="middle" style={{marginLeft: '1vw', marginBottom: '1vh'}}>
        <i>{snippet.description}</i>
          {/* <Col flex="8em">
            <b>Description</b>
          </Col>
          <Col flex="auto">
            <i>{snippet.description}</i>
          </Col> */}
        </Row>
            <SnippetEditor
                snippetCode={snippet.code}
                language='json'
                callback={(newV: string) => {
                    try {
                      const aniObj = JSON.parse(newV)
                      store.updateSnippetObj(snippetIdx, aniObj)
                      store.addLog('Edit Snippet', {snippetIdx: snippetIdx})
                    } catch (e) {
                      console.log('error', e)
                    }
                }}
            />
           
      {/* <SnippetController
                snippetConfig={snippet.config}
                snippetObj={snippet.obj}
                snippetIdx={snippetIdx}
            /> */}
        </Panel>
        <PanelResizeHandle style={{
                border: '0px dashed #d1dad0'
            }}/>
        <Panel defaultSize={50}>
            <SnippetController
                snippetConfig={snippet.config}
                snippetObj={snippet.obj}
                snippetIdx={snippetIdx}
            />
        </Panel>
    </PanelGroup>
    </div>
}

interface ItemProps {
    label: string,
    children: JSX.Element,
    key: string,
    closable?: boolean
}

const getTabItem = (snippet: Snippet, key: number):ItemProps => {
    return {
        label: snippet.title,
        children: getTabItemChildren(snippet, key),
        key: `snippet_${key}`,
        closable: true,
    }
}


const SnippetTab = observer(() => {
  const [activeKey, setActiveKey] = useState('');
  const [items, setItems] = useState([] as ItemProps[]);
  const newTabIndex = useRef(0);

  useEffect(()=> {
    const items = store.Snippets.map((s, sidx) => getTabItem(s, sidx))
    setItems(items)
    if (items.length) {
        setActiveKey(items[0].key)
    }
  }, [store.Snippets])

  const onChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey);
    const idx = items.findIndex((item) => item.key === newActiveKey)
    store.setActiveSnippet(idx)
    console.log('active snippet', idx, store.CurSession?.versions[store.activeVersion].snippets)
  };

  const add = () => {
    const newActiveKey = `snippet_${store.Snippets.length}`;
    const newPanes = [...items];
    newPanes.push({ label: 'New Snippet', children: <></>, key: newActiveKey });
    setItems(newPanes);
    setActiveKey(newActiveKey);
    // TO DO: add new snippet
  };

  const remove = (targetKey: TargetKey) => {
    let newActiveKey = activeKey;
    let lastIndex = -1;
    items.forEach((item, i) => {
      if (item.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    const newPanes = items.filter((item) => item.key !== targetKey);
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
    }
    setItems(newPanes);
    setActiveKey(newActiveKey);
  };

  const onEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove',
  ) => {
    if (action === 'add') {
      add();
    } else {
      remove(targetKey);
    }
  };

  return (
    <Tabs
      type="editable-card"
      onChange={onChange}
      activeKey={activeKey}
      size='small'
      onEdit={onEdit}
      style={{
        padding: '1vh .5vw 0 .5vw'
      }}
      items={items}
    />
  );
});
  
  export default SnippetTab;