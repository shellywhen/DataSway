import AppLayout from '@/components/AppLayout'
import { uiToken } from '@/assets/constant';
import { ConfigProvider, Typography  } from 'antd';
import { CodeOutlined, RobotOutlined } from '@ant-design/icons';

const {Text} = Typography;


function About() {

  return (
    <ConfigProvider
    componentSize="small"
    theme={uiToken}
  >
    <AppLayout
      selected='4'
      hasFooter={true}
    >
      <section style={{padding: '0 24px', minHeight: '88vh'}}>
        <h1>About</h1>
        <p>This is the prototype system for <a className="text-link" href="https://shellywhen.github.io/projects/DataSway" target="_blank">
          <i>DataSway: Vivifying Metaphoric Visualization with Animation Clip Generation and Coordination</i></a> (ACM DIS 2026).</p>
        <p><Text>To try on the tool, please first "<CodeOutlined /> Configure" the OpenAI API and input SVG, then switch to the "<RobotOutlined/> Workspace".</Text></p>
        <div className="video-player-wrapper" style={{
         minHeight: '70vh',
         height: '70vh',
         aspectRatio: '16 / 9',
        }}>
          <iframe
            width="75%"
            style={{
              aspectRatio: '16 / 9',
              border: 0,
            }}
            src="https://www.youtube.com/embed/4aMo1C6sY8s"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>
    </AppLayout>
    </ConfigProvider>
  )
}

export default About;
