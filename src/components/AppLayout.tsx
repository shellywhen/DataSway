import {
  InfoCircleOutlined,
  RobotOutlined,
  AppstoreOutlined,
  CodeOutlined,
  DownloadOutlined

} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, ColorPicker, Divider, Layout, Menu, Switch } from 'antd';
import React, { useState } from 'react';
import MenuItem from 'antd/es/menu/MenuItem';
import { store } from '@/store';
import { Color } from 'antd/es/color-picker/color';
import * as d3 from 'd3';
import { Link } from 'react-router-dom';

const USER_STUDY_LIST = [
  'A1: Chatbox',
  'A2: DataSway',
  'B1: Chatbox',
  'B2: DataSway',
  'C1: System',
  'C2: Chatbox',
]

interface NodeContainerProps {
  children: React.ReactNode;
  selected: string;
  hasFooter: boolean;
}

const { Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  onClick?: (e: React.MouseEvent) => void,
  items?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    items,
    label,
    onClick
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem(<Link to="/">About</Link>, '4', <InfoCircleOutlined />),
  getItem(<Link to="/gallery">Gallery</Link>, '3', <AppstoreOutlined />),
  getItem(<Link to="/board">Configure</Link>, '1', <CodeOutlined />),
  getItem(<Link to="/workspace">Workspace</Link>, '2', <RobotOutlined />),
];


const AppLayout: React.FC<NodeContainerProps> = ({children, selected, hasFooter}) => {
  const [collapsed, setCollapsed] = useState(store.isSideBarCollapsed);

  return (
    <Layout style={{ minHeight: '100vh'  }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value: boolean) => 
        {
          store.isSideBarCollapsed = value
          setCollapsed(value)
        }}>
        <a href="./"><div className="logo-vertical" >
          <img src="./logo.png" style={{width:"28px", height: "28px"}}/>{ !collapsed ? <h3 style={{color: "white"}}>DataSway</h3> : '' }
        </div></a>
        <Menu 
          theme="dark" 
          defaultSelectedKeys={[selected]} 
          mode="inline"
          items={items}
        >
        </Menu>
        <Divider />
        <div style={{
          marginTop: '20px',  
        }}>
          {
            (!hasFooter) && (store.isUserStudy) && <div style={{
              textAlign: 'center',
            }}> 
            <Switch 
              size="default" 
              value={!store.isBaseline} 
              checkedChildren="System" 
              unCheckedChildren="Chatbox" 
              style={{
                marginBottom: '1em'
              }}
            />
            {
              USER_STUDY_LIST.map((study, idx) => {
              return <div key={idx} style={{
                marginBottom: '5px',
                width: collapsed? '80px': '200px',
                padding: '0 10px'
              }}>
                <Button 
                  ghost 
                  style={{
                      width: '80%',
                      textAlign: 'left'
                  }}
                  onClick={()=>{
                    store.addLog('Task Start', {
                      name: study
                    })
                    store.setIsBaseline(study.includes('Chatbox'))
                  }}
              >{collapsed ? study.substring(0, 2) : study}</Button></div>
            }) 
            }

            <Button type="primary" 
              onClick={() => {
                const logs = store.sessions.map((s) => {s.log})
                console.log('logs', logs, store.sessions, store.Logs)
                const blob = new Blob([JSON.stringify(store.Logs, null, 2)], {type: 'application/json'})
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${store._name}-log-${new Date().toISOString()}.json`
                a.click()
                a.remove()      
              }}
              style={{
              width: collapsed? '60px': '145px',
              color: 'white',
              marginTop: '1em'
            }}>
              <DownloadOutlined/>Log
            </Button>

          </div> 
          }
        </div>
        <div style={{textAlign:'center', position: 'absolute', bottom: '10vh', width: collapsed? '80px': '200px'}}>
        { (!hasFooter) && <ColorPicker defaultValue="#F5F5F5" size='small' onChange={(color: Color, hex: string) => {
          console.log('hex', hex)
          d3.select('#preview-panel').style('background-color', hex)
        }}/> }
        </div>
      </Sider>
  
        <Content style={{ margin: '0 0'}}>
          
          { children }

          { hasFooter && <Footer style={{ textAlign: 'center' }}>
          DataSway ©{new Date().getFullYear()} Created by <a className="text-link" href="https://shellywhen.github.io" target="_blank">Liwenhan Xie</a>
        </Footer>}

        </Content>
        
      </Layout> 
  )
}

export default AppLayout
