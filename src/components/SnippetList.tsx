import { observer } from "mobx-react";
import { EditOutlined, PlayCircleFilled, EllipsisOutlined, PauseCircleFilled } from "@ant-design/icons";
import { Card } from "antd";
import { store } from "@/store";
import { Editor } from "@monaco-editor/react";
import { useEffect } from "react";
type LineNumbersType =  "on" | "off" | "relative" | "interval" | ((lineNumber:number) => string)
type WordWrapType = "on" | "off" | "wordWrapColumn" | "bounded" | undefined

const snippetOptions = {
    readOnly: false,
    minimap: {enabled: false},
    glyphMargin: false,
    lineNumbers: "on" as LineNumbersType,
    wordWrap: "on" as WordWrapType,
    lineDecorationsWidth: 5,
    lineHeight: 11,
    fontSize: 11
};


const SnippetList = observer(() => {
    useEffect(() => {
        console.log('active version', store.activeVersion)
    }, [store.activeVersion])
    return <>
    { store.Snippets.map((item, idx) => (
                <div key={idx}>
    
                <Card 
                    title={item.title}
                     actions={[
                        <EditOutlined key="edit" size={80}/>,
                        <PlayCircleFilled style={{color: '#afd0af'}} key="play" onClick={() => {
                            document.querySelector('#animation_code')?.remove()
                            const script = document.createElement('script');
                            script.textContent = `
                            ${item.code}
                            console.log('Script executed!');
                            `;
                            document.body.appendChild(script);
                        }} />,
                        <PauseCircleFilled style={{color: '#afd0af'}} key="pause" onClick={() => {
                            document.querySelector('#animation_code')?.remove()
                        }} />,
                        <EllipsisOutlined key="ellipsis" />,
                      ]} 
                     style={{ width: '100%' }} 
                     size="small">
                        <p style={{margin: 0}}>{item.description}</p>
                     <Editor 
                        height={'40vh'}
                        theme="vs-light"
                        defaultLanguage="javascript"
                        value={item.code}
                        onChange={(value) => {
                            if (typeof(value)==='undefined') return
                            store.setSnippetCode(idx, value)
                        }}
                        options={snippetOptions}
                    />
                    </Card>
           
                </div>
            ))}
    </>
})

export default SnippetList;