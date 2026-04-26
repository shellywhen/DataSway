import { BASE_URL, uiToken } from '@/assets/constant';
import AppLayout from '@/components/AppLayout'
import { ConfigProvider, Flex, Card, Tooltip } from 'antd';
import Meta from 'antd/es/card/Meta';
import { LinkOutlined} from '@ant-design/icons';


const galleryList = [
  {
    preview: 'gallery/case.gif',
    title: 'OECD Better Life Index',
    description: 'Case study of an interactive visualization (Ex7)',
    html: 'gallery/case.html',
  }, {
    preview: 'gallery/ex1.gif',
    title: 'CD Sales',
    description: 'Ex1: CD rotation aligning to sketches',
    html: 'gallery/ex1.html',
  }, {
    preview: 'gallery/ex2.gif',
    title: 'Hotel Ratings',
    description: 'Ex2: Display hotels by data value',
    html: 'gallery/ex2.html',
  },{
    preview: 'gallery/ex0.gif',
    title: 'Dreams',
    description: 'Ex3: Part of a metaphor',
    html: 'gallery/ex0.html',
  },{
    preview: 'gallery/ex4.gif',
    title: 'Eurovision',
    description: 'Ex4. Radius-based coordination',
    html: 'gallery/ex4.html',
  }, {
    preview: 'gallery/ex5.gif',
    title: 'Seal Collection',
    description: 'Ex5. Random-based ripples',
    html: 'gallery/ex5.html',
  }, {
    preview: 'gallery/ex3.gif',
    title: 'Bamboo Poems',
    description: 'Ex6. Projection-based order',
    html: 'gallery/ex3.html',
  },  
]

function Gallery() {
  // const [isHome, setIsHome] = useState(true);
  // const [focusCase, setFocusCase] = useState<CaseProps | null>(null);

  return (
    <ConfigProvider
      theme={uiToken}
    >
    <AppLayout
      hasFooter={true}
      selected='3'
    >
      <section style={{padding: '0 24px', minHeight: '88vh'}}>
        <h1>Gallery</h1>

        <div>
      
        <Flex 
            wrap={true}
            gap='middle'
            justify='flex-start'
            align='center'
        >
            {galleryList.map((item, i) => (
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
                                alt={`${item.title}`} 
                                style={{
                                    height: '100%',
                                    width: 'auto',
                                    objectFit: 'cover',
                                }}
                                src={item.preview} 
                                onError={(e)=> {
                                    e.currentTarget.src = BASE_URL + 'images/fallback.png'
                                }}
                            />
                    </div>}
                    hoverable
                    size="small"
                    onClick={() => {
                            // jump to the new page _blank
                            window.open(item.html, '_blank');
                        }
                    }
                >
                <Meta title={item.title} description={<>
                    {item.description} &nbsp;
                    {/* <Tooltip placement='top' title="source">
                        <a href={.source} target="_blank">
                            <LinkOutlined  />
                        </a>
                    </Tooltip> */}
                </>} style={{fontSize: "small"}} />
                </Card>
            ))}
        </Flex>


        </div>
      </section>
    </AppLayout>
    </ConfigProvider>
  )
}

export default Gallery;
