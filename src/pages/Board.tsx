import AppLayout from '@/components/AppLayout';
import { Card, Divider, Flex, List, Space, Row, Col, Input, Button, notification, Upload, Modal, Table, ConfigProvider, Tooltip, Form  } from 'antd';
import { useEffect, useState } from 'react';
import Meta from 'antd/es/card/Meta';
import type { UploadFile, UploadProps } from 'antd';
import { RetweetOutlined, MessageOutlined, StarOutlined, UploadOutlined, DeleteOutlined, TableOutlined, FileOutlined, FileTextOutlined, LockOutlined, LinkOutlined, CloudDownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import  SvgLassoSelection from '@/components/SvgLassoSelection'
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { JsonTree } from 'react-editable-json-tree';
import * as d3 from 'd3';
import { observer } from "mobx-react";
import { BASE_URL, HOST, uiToken } from '@/assets/constant';
import { store } from '@/store';
import React from 'react';
import SvgXMLEditor from '@/components/SvgXMLEditor';
import { EXAMPLE_FOLDER_NAMES, EXAMPLE_FOLDER_PATH } from '@/assets/examples';
import { format } from 'date-fns';
import { testAPITokenValidity } from '@/assets/message';


const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
      {React.createElement(icon)}
      {text}
    </Space>
  );

const getFileIcon = (ext: string) => { 
    if (ext === 'csv') {
        return <TableOutlined />
    } else if (ext === 'json') {
        return <FileOutlined />
    } 
    return <FileTextOutlined />
}

const Board = observer(() => {
    const [token, setToken] = useState<string>(store.token || '')
    const [needReset, setNeedReset] = useState<boolean>(false)
    const [fileList, setFileList] = useState<FileListItemProps[]>(store.CurSession?.fileList || [])
    const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<JSX.Element>(<></>);
    const [modalTitle, setModalTitle] = useState('');
    const [hasLoaded, setHasLoaded] = useState(false);
    const [examples, setExamples] = useState<ExampleProps[]>([])
    const [api, contextHolder] = notification.useNotification({
        placement: 'top',
    })

    const openNotification = (status='error') => {
        if (status === 'error') {
            api.error({
            message: `Error`,
            description:
            'Your OpenAI API token is invalid. Please try again.',
        })
        } else {
            api.success({
                message: `Success`,
                description:
                'Your OpenAI API token is valid. A new session has been created.',
            })
        }
    }

    const showPreviweModal = () => setIsPreviewModalVisible(true);
    const handlePreviewModalCancel = () => setIsPreviewModalVisible(false);
  

    const handleFileUploadChange: UploadProps['onChange'] = (info) => {
        const fileList = [...info.fileList];
        const newFileList = fileList.map((file) => {
          if (file.response) {
            file.url = file.response.url
          }
          return file as unknown as FileListItemProps
        })
        setFileList(newFileList)
    }

    const showFilePreviewComponent = async (file: UploadFile) => {
        setModalTitle(file.name)
        const ext = file.name.split('.').pop() || ''
        console.log(ext)
        if (ext === 'csv') {
            try {
                const data = await d3.csv(file.url as string)
                const columns = Object.keys(data[0]).map((key) => ({
                    title: key,
                    dataIndex: key,
                    key,
                }))
                const dataSource = data.map((d, i) => ({...d, key: i}))
                setModalContent(<Table dataSource={dataSource} columns={columns} />)
            } catch (error) {
                setModalContent(<><p>Failed to load the file. Please try again.</p><p>{JSON.stringify(error)}</p></>)
            }
        }
        else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif') {
            setModalContent(<img src={file.url} alt={file.name} style={{maxWidth: '80%', maxHeight: '60vh'}} />)
        }
        else {
            try {
                const res = await fetch(file.url as string)
                const content = await res.text()
                if (ext === 'json' || ext === 'geojson') {
                    setModalContent(<JsonTree data={JSON.parse(content)} isCollapse={false} />)
                } else if (ext == 'js' || ext == 'ts' || ext == 'css' || ext == 'html') {
                    setModalContent(<SyntaxHighlighter language="javascript" style={docco} wrapLines={true}>
                        {content}
                    </SyntaxHighlighter>)
                } else if (ext === 'svg') {
                    setModalContent(<div dangerouslySetInnerHTML={{__html: content}}></div>)
                }
            } catch (error) {
                setModalContent(<><p>Failed to load the file. Please try again.</p><p>{JSON.stringify(error)}</p></>)
            }
        }
        showPreviweModal()
    }

    useEffect(() => {
        // When loading the boading page, dynamically load the example configurations
        if (hasLoaded) return;
        setHasLoaded(true);
        Promise.all(EXAMPLE_FOLDER_NAMES.map((folder) => {
            const path = `${EXAMPLE_FOLDER_PATH}${folder}/`;
            return fetch(path + 'config.json').then((config) => {
                return config.json()
            }, (err) => {
                console.error(err)
                return null
            })
        })).then((results) => {
            setExamples(results.map((res, idx)=> {
                if (res === null) return null
                return {...res, folder: EXAMPLE_FOLDER_NAMES[idx]}
            }).filter((res) => res))
        })
    }, [])

    useEffect(()=> {
        setFileList(store.CurSession?.fileList || [])
    }, [store.CurSession])


    

    return (
<ConfigProvider theme={uiToken}>
<AppLayout selected='1' hasFooter={true}>
       { contextHolder }
      <div style={{paddingLeft: "24px", paddingRight: "24px"}}>
        <h1>Getting Start</h1>
        <div className="currentSession">
            <Space direction="horizontal" style={{
                marginRight: '1em'
            }}>
                { 
                    "User"
                }
                <Input 
                    style={{ width: 120 }}
                    placeholder='Your Name'
                    defaultValue={'User'}
                    onChange={(e) => {
                        store.setName(e.target.value)
                    }}
                />
            </Space>
           <Space direction="horizontal">
                { 
                    "OpenAI API Token"
                }
                <Form>
                <Input.Password 
                    style={{ width: 400 }}
                    disabled={needReset? false: true}
                    defaultValue={ token }
                    prefix={<><LockOutlined />&nbsp;</>}
                    onChange={(e) => {
                    if (e.target.value.length > 0) {
                        setToken(e.target.value)
                    }
                }}
                />
                <Button 
                    style={{
                        marginLeft: '1em'
                    }}
                    type="default" 
                    onClick={() => {
                    if (!needReset) {
                        setNeedReset(true)
                        setToken('')
                        return
                    }
                    testAPITokenValidity(token).then((res) => {
                        console.log(res.choices[0].message.content)
                        openNotification('success')
                        store.setToken(token)
                        setNeedReset(false)
                    }).catch((err) => {
                        console.error(err)
                        openNotification('error')
                    })
                } }>{needReset? 'Confirm':'Reset'}</Button>
                </Form>
            </Space> 
         
        <Row gutter={18}>
            <Col span={5} style={{textAlign: 'center'}}>
                <Divider  orientation='center'>Files</Divider>
                <p>Uploading file is not supported yet.</p>
                <Upload fileList={fileList}
                    action={`${HOST}/upload`}
                    onChange={handleFileUploadChange}
                    multiple={true}
                    itemRender={(_, file) => {
                        return <div className="customFileWrapper">
                            <Row>
                                <Col span={20} style={{textAlign: 'left', justifyContent: 'left'}}>
                                    <Button size="small" 
                                        type="text" 
                                        style={{textAlign: 'left', justifyContent: 'left'}} 
                                        block={true}
                                        icon={
                                            getFileIcon(file.name.split('.').pop() || '')                                         
                                        }
                                        onClick={() => {  
                                            showFilePreviewComponent(file)   
                                        }}
                                        >  {file.name} </Button>
                                </Col>
                                <Col span={4}>
                                <Button type="text" size="small" onClick={() => {
                                    // remove file from list
                                }}><DeleteOutlined /></Button>
                                </Col>
                            </Row>
                           
                        </div>
                    }}
                >
                    {/* <Button icon={<UploadOutlined />}>Click to Upload</Button> */}
                </Upload>
            </Col>
            <Col span={10}>
                <Divider  orientation='center'>Preview</Divider>
                <SvgLassoSelection 
                    svgString={store.CurSession?.svg || ''} 
                    svgStyle={store.CurSession?.styles || []}
                    targetWidth={300}
                    targetHeight={300}
                    resize={true}
                    hasController={false}
                />
            </Col>
            <Col span={9}>
                <Divider  orientation='center'>Specification</Divider>
                <SvgXMLEditor xml={store.CurSession?.svg || ''} />
            </Col>
        </Row>

        </div>

        <Modal
            title={modalTitle}
            open={isPreviewModalVisible}
            onOk={handlePreviewModalCancel}
            onCancel={handlePreviewModalCancel}
            width={"75vw"}
        >
            { modalContent }
        </Modal>

        <Divider orientation='center'>Try Static Examples</Divider>

 
        <Flex 
            wrap={true}
            gap='middle'
            justify='space-evenly'
            align='center'
        >
            {examples.map((config: ExampleProps, i) => (
                <Card 
                    key={i}
                    cover={
                        <div style={{ 
                            height: '200px',
                            maxWidth: '240px',
                            overflow: 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: 'auto'
                        }}>
                            <img 
                                alt={`${config.title}`} 
                                style={{
                                    height: '100%',
                                    width: 'auto',
                                    objectFit: 'cover',
                                }}
                                src={`${EXAMPLE_FOLDER_PATH}${config.folder}/${config.thumbnail??'thumbnail.png'}`} 
                                onError={(e)=> {
                                    e.currentTarget.src = BASE_URL + 'images/fallback.png'
                                }}
                            />
                    </div>}
                    hoverable
                    size="small"
                    onClick={() => {
                            store.initSession(config)
                        }
                    }
                >
                <Meta title={config.title} description={<>
                    {config.description} &nbsp;
                    <Tooltip placement='top' title="source">
                        <a href={config.source} target="_blank">
                            <LinkOutlined  />
                        </a>
                    </Tooltip>
                </>} style={{fontSize: "small"}} />
                </Card>
            ))}
        </Flex>


        <Divider  orientation='center'>Resume History</Divider>

<List
    itemLayout="vertical"
    size="small"
    pagination={{
        pageSize: 10,
        size: 'small',
    }}
    dataSource={store.sessions}
    renderItem={(item: UserSession, sidx: number) => (
    <List.Item
        key={item.id}
        actions={[
        <IconText icon={StarOutlined} text={`${item.versions.length}`} key="list-vertical-star-o" />,
        <IconText icon={MessageOutlined} text={`${item.messages.length}`} key="list-vertical-message" />,
        <IconText icon={CalendarOutlined} text={'Last: '+ format(new Date(item.updated_at),'MMM d, yyyy HH:mm:ss')} key="list-vertical-calendar" />,
        <a onClick={()=>{
            store.setCurSession(item.id)
        }}><RetweetOutlined key="list-vertical-resume"/>&nbsp;Resume</a>,
        <a onClick={()=>{
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href",     dataStr);
            downloadAnchorNode.setAttribute("download", `${item.id}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }} ><CloudDownloadOutlined key="list-vertical-download"/>&nbsp;Download</a>,
        <a onClick={()=>{
            store.deleteSession(item.id)
        }}><DeleteOutlined key="list-vertical-delete"/>&nbsp;Delete</a>,
        ]}
        // extra={
        // <img
        //     width={180}
        //     alt="logo"
        //     src="./images/fallback.png"
        // />
        // }
    >
        <span
            style={{
                border: '1px solid #aaaaaa',
                borderRadius: '4px',
                padding: '2px 6px',
                marginRight: '2px'

            }}
            onChange={(e)=>{
                const newV = e.currentTarget.innerText
                if (newV === item.id) return
                store.updateSession(sidx, {field: 'id', value: newV})
        }}>{item.id}</span><span> {' ' + format(new Date(item.created_at),'MMM d, yyyy HH:mm:ss')}</span>
        { item.id === store.curSessionId ? <span style={{color: 'teal'}}>&nbsp;<b>(Current Session)</b></span> : <></>}
    </List.Item>
    )}
/>
    


      </div>
    </AppLayout>
    </ConfigProvider>
  )
})

export default Board;
