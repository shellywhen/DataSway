import { useEffect, useState } from "react";
import { store } from '@/store';
import SvgLassoSelection from "@/components/SvgLassoSelection";
import { ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { observer } from "mobx-react";
import { FloatButton, Drawer, Card, Button, ConfigProvider, Flex, Tooltip, Space, Checkbox, Select, notification } from "antd";
import { BookOutlined, EditOutlined, PlayCircleFilled, EllipsisOutlined, PauseCircleFilled, LoadingOutlined, SendOutlined, BulbOutlined } from "@ant-design/icons";
import * as d3 from "d3";
import { TimelinePanel } from "@/components/TimelinePanel";
import TextArea from "antd/es/input/TextArea";
import Chatbox from "@/components/Chatbox";
import SnippetTab from "@/components/SnippetTab";
import AppLayout from "@/components/AppLayout";
import { uiToken } from "@/assets/constant";
import { _getMsg2GPT, approximatedToken, getMsg2GPT, queryGPT } from "@/assets/message";
import { ANIMATION_SCHEMA, BASELINE_SCHEMA, formatQualityCheck, QA_SCHEMA, QA_SYSTEM_PROMPT } from "@/assets/prompt";
import Baseline from "@/components/Baseline";
import React from "react";
import { high_simplify, mid_simplify } from "@/assets/svg-processor";
import { set } from "date-fns";



const Tool = observer(() => {
    const [userInputText, setUserInputText] = useState('')
    const [needImg, setNeedImg] = useState(true)
    const [needCleanSvg, setNeedCleanSvg] = useState(true)
    const [needQA, setNeedQA] = useState(true)
    const [versionOptions, setVersionOptions] = useState<{label: string, value: number}[]>([])
    const [activeVersion, setActiveVersion] = useState<number[]>([])
    const [rightPanelRatio, setRightPanelRatio] = useState(store.Messages.length ? 40 : 99)
    const panelRef = React.createRef<ImperativePanelHandle>()
    const handleVersionChange = (value: number[]) => {
        setActiveVersion(value)
    }
    const [api, contextHolder] = notification.useNotification({
        placement: 'top',
    })

    useEffect(() => {
        if (store.CurSession) {
            setVersionOptions(store.CurSession.versions.map((v, idx) => {
                return {
                    label: `V${idx}`,
                    value: idx
                }
            }))
        }

    }, [store.activeVersion])


    useEffect(() => {
        if (!store.CurSession) return
        setActiveVersion([])
        if (store.isBaseline) {
            setVersionOptions(store.CurSession._versions.map((v, idx) => {
                return {
                    label: `V${idx}`,
                    value: idx
                }
            }))
        } else {
            setVersionOptions(store.CurSession.versions.map((v, idx) => {
                return {
                    label: `V${idx}`,
                    value: idx
                }
            }))
        }
    }, [store.isBaseline])

    const query = (svgNode: SVGElement) => {
        setActiveVersion([])

        let svg = needCleanSvg? mid_simplify(store.CurSession!.svg): store.CurSession!.svg
        const svgToken = approximatedToken(svg)
        if (svgToken > 100000) {
            svg = high_simplify(svg, 10, 0.2)
        }

        console.log(svgToken, 'token size')
        if (svgToken > 100000) return

        const selectedCode = activeVersion.map((idx) => {
            return {
                code: JSON.stringify(store.CurSession!.versions[idx].snippets.map((s) => s.obj)),
                idx: idx
            }
        })
        const msgs = getMsg2GPT(store.Messages, {isInspire: false, svg, selectedCode} )
        console.log(msgs, 'check msgs :-X')
        queryGPT(store.token, msgs, ANIMATION_SCHEMA, svgNode).then((res) => {
            store.addLog('Receive LLM Response', { response: res })
            try {
                const versionObj = JSON.parse(res as string) as VersionMsg
                store.setIsLoading(false)
                store.addVersion(versionObj)
                store.addMessage('assistant', versionObj.message, {
                    versionIdx: store.activeVersion
                })
                panelRef.current?.resize(50)
                // initiate the quality check
                const qaMsgs = [{
                    role: "system",
                    content: QA_SYSTEM_PROMPT
                }, {
                    role: "user",
                    content: formatQualityCheck(msgs[msgs.length - 1].content, res as string, svg)
                }] as Chat2GPT[]
                if (!needQA) return
                queryGPT(store.token, qaMsgs, QA_SCHEMA, svgNode).then((qa_res) => {
                    try {
                        const qaRes = JSON.parse(qa_res as string) as QAMsg
                        store.addLog('Receive LLM QA Response', { QA: qa_res })
                        store.appendLastMessage(qaRes)
                    } catch (e) {
                        console.error(e)
                        store.setIsLoading(false)
                        api.error({
                            message: e.toString(),
                            description: 'Fail to parse the response. Please try again.',
                        })
                    }
                })

            } catch (e) {
                console.error(e)
                store.setIsLoading(false)
                api.error({
                    message: e.toString(),
                    description: 'Fail to parse the response. Please try again.',
                })
                // TODO: Try again

            }
        }, (err) => {
            api.error({
                message: err.toString(),
                description: 'Fail to query. Please check the token & network.',
            })
            store.setIsLoading(false)
        })

    }

    const _query = (svgNode: SVGElement) => {
        setActiveVersion([])
        const svg = needCleanSvg? mid_simplify(store.CurSession!.svg): store.CurSession!.svg
        const selectedCode = activeVersion.map((idx) => {
            return {
                code: JSON.stringify(store.CurSession!._versions[idx]),
                idx: idx
            }
        })
        const msgs = _getMsg2GPT(store.Messages, {isInspire: false, svg, selectedCode} )
        queryGPT(store.token, msgs, BASELINE_SCHEMA, svgNode).then((res) => {
            store.addLog('Receive LLM Response', {
                response: res
            })
            try {
                const versionObj = JSON.parse(res as string) as _VersionMsg
                store.setIsLoading(false)
                store.add_Version(versionObj.script)
                store.addMessage('assistant', versionObj.message, {
                    _script: versionObj.script,
                    _versionIdx: store.CurSession!._versions.length - 1
                })
                setRightPanelRatio(50)
                if (versionObj.script.length) store.setScript(versionObj.script)
            } catch (e) {
                console.error(e)
                store.setIsLoading(true)
                // TODO: Try again
                
            }
        },  (err) => {
            api.error({
                message: err.toString(),
                description: 'Fail to query. Please check the token & network.',
            })
            store.setIsLoading(false)
        })

    }

    return <ConfigProvider
    componentSize="small"
    theme={ uiToken }
  >
    <AppLayout
        selected='2'
        hasFooter={false}
        >
            {contextHolder}    
        <PanelGroup autoSaveId="ui-layout" direction="horizontal" style={{
        }}>
            <Panel defaultSize={rightPanelRatio} ref={panelRef}
                 
                minSize={20}
                style={{
                    minHeight: '100%'
                }}
            >        
                <div id="preview-panel" style={{ 
                    padding: '1vh 2vw',
                    display: 'flex',
                    alignItems: 'center',
                 }}>
                    <SvgLassoSelection svgString={store.CurSession?.svg || ''} svgStyle={store.CurSession?.styles || []} hasController={true} resize={true}/>
                </div>
                <Flex 
                    style={{
                        padding: '0 5vw',
                    }}
                    gap={10}
                >
                    <Tooltip placement="top" title="Inspire me!">
                        {/* <Button id="inspiration-button"
                            style={{ padding: '0 5px 0 8px' }}
                            size="small"
                            onClick={(e) => {
                                store.addMessage('user', 'Based on the vis, think diverse about potential animation.', {isInspire: true})
                                const msgs = getMsg2GPT(store.Messages, {isInspire: true, svg: store.CurSession!.svg} )
                                store.setIsLoading(true)
                                queryGPT(store.token, msgs, ).then((res) => {
                                    store.setIsLoading(false)
                                })
                            }}
                        >
                            <BulbOutlined style={{ margin: 0 }} />
                        </Button> */}
                    </Tooltip>
                        <TextArea placeholder="Describe the target animated effect." 
                           size="middle"
                            allowClear 
                            value={userInputText}
                            autoSize={{ minRows: 1, maxRows: 5 }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                if (e.key !== 'Enter') return
                                e.preventDefault(); 
                                const button = document.querySelector('#user-input-button') as HTMLButtonElement
                                button?.click()
                        }}  onChange={(e) => {
                                setUserInputText(e.target.value)
                        }} />
                      
                        <Button id="user-input-button"
                            style={{ padding: '0 5px 0 8px' }}
                            size="small"
                            onClick={() => {
                                setUserInputText('')
                                store.addMessage('user', userInputText)
                                store.addLog('User Input', {
                                    text: userInputText
                                })
                                store.setIsLoading(true)
                                const svgNode = d3.select('.svg-overlay-wrapper').select('svg').node() as SVGElement
                                if (store.isBaseline) {
                                    _query(svgNode)
                                } else {
                                    query(svgNode)
                                }
                            }}
                        >
                            {store.isLoading ? <LoadingOutlined /> : <SendOutlined rotate={-45} style={{ margin: 0 }} />}
                        </Button>

                </Flex>
                <Space style={{
                    padding: '1vh 0 0 5.5vw',
                }}>
                        <Checkbox defaultChecked={true} checked={needImg} onChange={()=>{
                            setNeedImg(!needImg)
                        }}>Image</Checkbox>
                           <Checkbox defaultChecked={false} checked={needCleanSvg} onChange={()=>{
                            setNeedCleanSvg(!needCleanSvg)
                        }}>Svg</Checkbox>
                        <Checkbox defaultChecked={false} checked={needQA} onChange={()=>{
                            setNeedQA(!needQA)
                        }}>Check</Checkbox>

                <Select
                    mode="multiple"
                    size="small"
                    placeholder="Version"
                    defaultValue={[]}
                    onChange={handleVersionChange}
                    style={{ width: '150px' }}
                    options={versionOptions}
                    />
                                    
               </Space>
                
                <Chatbox></Chatbox>

            </Panel>

            <PanelResizeHandle className="panel-draggable-handle"/>
            <Panel id="rightPanelContainer" defaultSize={store.Messages.length?50:0} onResize={(size: number) => {
                if (size < 10) {
                    return
                }
                const width = document.querySelector('#rightPanelContainer')?.clientWidth || 200
                store.setRightPanelPixel(width)
            }}>
            { (!store.isBaseline) &&  <PanelGroup direction="vertical">
                    <Panel defaultSize={70}>               
                        <SnippetTab></SnippetTab>
                    </Panel>
                    <PanelResizeHandle />
                    <Panel defaultSize={30}>
                       <TimelinePanel vidx={store.activeVersion} version={store.CurSession?.versions[store.activeVersion]}/>
                    </Panel>
                </PanelGroup>
            }
            {
                store.isBaseline && <Baseline/>
            }
            </Panel>

        </PanelGroup>
    </AppLayout>
  </ConfigProvider>



})

export default Tool;