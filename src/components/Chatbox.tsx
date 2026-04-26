import { store } from "@/store"
import { Avatar, Button, Col, List, Row, Typography } from "antd"
import { active } from "d3"
import { observer } from "mobx-react"
import { useEffect, useState } from "react"

const { Text } = Typography

const Chatbox = observer(() => {
    const [activeVersion, setActiveVersion] = useState(store.activeVersion)

    useEffect(()=>{
        setActiveVersion(store.activeVersion)
    }, store.activeVersion)


    return <div className={`chatbot-wrapper chatbot-wrapper-${store.chatboxFlag}`}>
    <List
        itemLayout="horizontal"
        data-chatbox-size = {store.Messages.length}
        dataSource={store.Messages}
        renderItem={(msg, midx) => {
            if (msg.role === 'user' ) {
                return <List.Item key={midx} className="user-message-wrapper message-wrapper">
                <Avatar src='./images/cat.png' />
                <div>
                    {msg.content}
                </div>
            </List.Item>
            } else if (msg.role === 'assistant') {
                return <List.Item  key={midx} className="bot-message-wrapper message-wrapper">
                <Avatar src='./images/robot.png' />

                <div>
                   { ( ((!store.isBaseline) && 'versionIdx' in msg) || (store.isBaseline && msg._script)) && <Button
                        type="dashed"
                        
                        style={{
                            marginRight: '1em',
                            borderColor: activeVersion === msg.versionIdx ? '#559E7D' : '#d9d9d9',
                            borderWidth: activeVersion === msg.versionIdx ? '2px' : '1px',
                            borderStyle: activeVersion === msg.versionIdx ? 'solid' : 'dashed',
                        }}
                        onClick={()=> {
                            if (store.isBaseline) {
                                store.setScript(msg._script??'')
                                return;
                            } else if (typeof(msg.versionIdx) === 'number') {
                                store.setAciveVersion(msg.versionIdx)
                                setActiveVersion(msg.versionIdx)
                            }
                    }} >Version {msg.versionIdx} 
                    </Button> }
                    { msg.content }
                    {'isValid' in msg && (!msg.isValid) && <div>
                        ⚠️<Text mark style={{
                        }}><b>Note</b></Text>  <Text>{msg.explanation}</Text>
                    </div>}
                </div>
            </List.Item>
            }
        }}
    >
    </List>
    </div>
    
})

export default Chatbox