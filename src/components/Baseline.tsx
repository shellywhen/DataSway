import { observer } from "mobx-react"
import SnippetEditor from "./SnippetEditor"
import { store } from "@/store"
import { Button, Flex } from "antd"
import { PlayCircleFilled, PauseCircleFilled, ReloadOutlined } from '@ant-design/icons';

const Baseline = observer(() => {
    return <div className="baseline-wrapper" style={{
        padding: '5vh 1vw 0 .5vw',
        textAlign: 'center'
    }}>
        <Flex 
            justify="space-between"
            align="start"
        style={{
            width: '250px',
            marginBottom: '2vh',
            marginLeft: '1vw',
            textAlign: 'center'
       }}>
   
        <Button
            onClick={
                () => {
                    console.log('store._script', store._script)
                    store.addLog('Play Animation')
                    if (document.querySelector('#anime-script') === null) {
                        const animeScript = document.createElement('script')
                        animeScript.id = 'anime-script'
                        animeScript.src = './anime.min.js'
                        document.body.appendChild(animeScript)
                    }
                    document.querySelector('.baseline-animation-script')?.remove()
                    setTimeout(() => {
                        const script = document.createElement('script')
                        script.setAttribute('class', 'baseline-animation-script')
                        script.innerHTML = store._script
                        document.body.appendChild(script)       
                    }, 2000)
                }
            }
        ><PlayCircleFilled className="playerBtn" />Play</Button>
        <Button
            onClick={
                () => {
                    store.addLog('Stop Animation')
                    document.querySelector('.baseline-animation-script')?.remove()
                }
            }
        ><PauseCircleFilled className="playerBtn"/> Pause </Button>

        <Button
            onClick={()=>{
                store.updateSvgFlag()
                document.querySelector('.baseline-animation-script')?.remove()
            }}
        ><ReloadOutlined className="playerBtn" />
            Recover
      </Button>
        </Flex>
        <SnippetEditor
            snippetCode={store._script}
            language='javascript'
            height={"80vh"}
            callback={(newV: string) => {
                store.setScript(newV)
            }}
         />       
    </div>
})

export default Baseline