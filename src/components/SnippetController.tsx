import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { store } from '@/store';
import { Button, Col, InputNumber, Row, Segmented, Slider, Space } from 'antd';
import { AimOutlined, DragOutlined, RetweetOutlined, SmallDashOutlined, RedoOutlined, BarChartOutlined, ZoomInOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react';
import { set } from 'date-fns';
import { uiToken } from '@/assets/constant';

const panels = [
	{ label: 'Data-Centric', value: 'data', icon: <BarChartOutlined />, about: 'Order by data values' },
	{ label: 'Layout-Centric', value: 'spatial', icon: <DragOutlined />, about: 'Order by spatial layout' },
	{ label: 'Layer-Centric', value: 'occurance', icon: <SmallDashOutlined />, about: 'Order by SVG layer' },
	{ label: 'Random-Based', value: 'random', icon: <RetweetOutlined />, about: 'Random order' },
]

interface SnippetControllerProps {
	snippetConfig: SnippetConfigProps,
	snippetObj: Record<string, any>,
	snippetIdx: number
}
const SnippetController = observer(({snippetConfig, snippetObj, snippetIdx}: SnippetControllerProps) => {
	const [unitValue, setUnitValue] = useState(snippetConfig.unit);
	const [offsetValue, setOffsetValue] = useState(snippetConfig.offset);
	const [delayValue, setDelayValue] = useState(snippetConfig.delay);
	const [dataOrderValue, setDataOrderValue] = useState(snippetConfig.data.order);
	const [dataRankValue, setDataRankValue] = useState(snippetConfig.data.rank);
	const [durationValue, setDurationValue] = useState(snippetConfig.duration||1000);

	useEffect(() => {
		setDelayValue(snippetConfig.delay);
	}, [store.configFlag])

	return <div 
		className="snippet-controller-panel"
		style={{
			padding: '0 1vw 0'
		}}
	>
		{/* <Row align="middle" style={{marginBottom: '1vh'}}>
			<Col flex="8em">
				<b>Targets&nbsp;<ZoomInOutlined /></b>
			</Col>
			<Col flex="auto">
				<span><code>{snippetObj.targets??""}</code></span>&nbsp;
			</Col>
		</Row> */}
		<h3>Coordination</h3>
		<Row align="middle" style={{
			marginBottom: '1vh'
		}}>
			<Col>
			<Row gutter={8}>
				{panels.map((panel, idx) => {
					return <Col flex="auto" key={idx}>

					<div style={{
						borderWidth: '3px',
						borderRadius: '5px',
						borderStyle: 'solid',
						textAlign: 'center',
						paddingTop: '0.5em',
						minWidth: '150px',
						width: 'fit-content',
						paddingBottom: '-0.5em',
						borderColor: unitValue === panel.value ? '#78AB92' : 'transparent',
						backgroundColor: 'white',
						filter: unitValue === panel.value ? 'drop-shadow(0px 0px 2px #bfbfbf)' : 'none'

					}}
						onClick={()=>{
							setUnitValue(panel.value)
							store.addLog('Update Unit', {unit: panel.value})
							store.updateSnippet(snippetIdx, {
								field: 'unit',
								value: panel.value
							})
							if (panel.value === 'random') {
								store.updateSnippet(snippetIdx, {
									field: 'randomSeed',
									value: Math.floor(Math.random() * 1000)
								})
							}
						}}
					>
						
						<div style={{
							fontSize: '1.05em',
							fontWeight: unitValue === panel.value ? 'bold' : '600',
							color: unitValue === panel.value ? '#78AB92' : ''
						}}>{panel.label}</div>
						<div style={{
							fontSize: '0.9em',
							marginBottom: '-1.5vh',
							color: unitValue === panel.value ? '#78AB92' : '#bfbfbf'
						}}>{panel.about}</div>
						<div style={{
							fontSize:'4em',
							marginBottom: '-0.1em',
							color: unitValue === panel.value ? '#78AB92' : '#bfbfbf'

						}}> {panel.icon} </div>
						

					</div>

					</Col>
				})}
			</Row>
			</Col>
			{/* <Col flex="auto">
				<Segmented
					options={[
						{ label: 'SVG Structure', value: 'occurance', icon: <SmallDashOutlined /> },
						{ label: 'Spatial Layout', value: 'spatial', icon: <DragOutlined /> },
						{ label: 'Data Value', value: 'data', icon: <BarChartOutlined /> },
						{ label: 'Random', value: 'random', icon: <RetweetOutlined />},
					]}
					value={ unitValue }
					onChange={(v)=> {
						setUnitValue(v)
						store.addLog('Update Unit', {unit: v})
						store.updateSnippet(snippetIdx, {
								field: 'unit',
								value: v
							}
						)
						if (v === 'random') {
							store.updateSnippet(snippetIdx, {
								field: 'randomSeed',
								value: Math.floor(Math.random() * 1000)
							})
						}
						setUnitValue(v)
					}}
				/>

					{ unitValue === 'spatial' && <div style={{
							color: 'teal'
						}}>
							&nbsp;Please indicate in the preview.
						</div>
					}
					{
						unitValue === 'random' && <div>&nbsp;<Button size="small"><RedoOutlined />Generate a new random seed</Button></div>
					}
					{
						unitValue === 'data' && <div>
							&nbsp; <Space>
									<Segmented
										options={[
											{ label: 'Ascending', value: 'asc' },
											{ label: 'Descending', value: 'desc' },
										]}
										value={dataOrderValue}
										onChange={(v: 'asc'|'desc') => {
											store.addLog('Update Data Order', {order: v})
											setDataOrderValue(v)
											store.updateSnippet(snippetIdx, {
												field: 'data',
												value: {
													rank: snippetConfig.data.rank,
													order: v
												}
											})
										}}
									/>

									<Segmented
										options={[
											{ label: 'Rank', value: true },
											{ label: 'Proportional', value: false },
										]}
										value={dataRankValue}
										onChange={(v) => {
											setDataRankValue(v)
											store.addLog('Update Data Rank', {rank: v})
											store.updateSnippet(snippetIdx, {
												field: 'data',
												value: {
													rank: v,
													order: snippetConfig.data.order
												}
											})
										}}
									/>
							</Space>
						</div>
					}
			</Col> */}
			
		</Row>
		<Row>
		{
						unitValue === 'data' && <div>
							&nbsp; <Space>
									<Segmented
										options={[
											{ label: 'Ascending', value: 'asc' },
											{ label: 'Descending', value: 'desc' },
										]}
										value={dataOrderValue}
										onChange={(v: 'asc'|'desc') => {
											store.addLog('Update Data Order', {order: v})
											setDataOrderValue(v)
											store.updateSnippet(snippetIdx, {
												field: 'data',
												value: {
													rank: snippetConfig.data.rank,
													order: v
												}
											})
										}}
									/>

									<Segmented
										options={[
											{ label: 'Rank', value: true },
											{ label: 'Proportional', value: false },
										]}
										value={dataRankValue}
										onChange={(v) => {
											setDataRankValue(v)
											store.addLog('Update Data Rank', {rank: v})
											store.updateSnippet(snippetIdx, {
												field: 'data',
												value: {
													rank: v,
													order: snippetConfig.data.order
												}
											})
										}}
									/>
							</Space>
						</div>
					}
		</Row>
		<Row align="middle" style={{marginBottom: '2vh', marginTop: '1vh'}}>
			<Col flex="18em">
			<div style={{display: 'inline-block'}}>
				<span style={{marginRight: '1em'}}><b>Offset</b></span>
				<InputNumber 
					addonAfter={<span style={{padding: 0, margin: 0}}>ms</span>}
					size="small" 
					min={0}
					style={{ width: '12em' }} 
					value={offsetValue}
					onChange={(v) => {
						setOffsetValue(v)
						store.addLog('Update Offset', {offset: v})
						store.updateSnippet(snippetIdx, {
							field: 'offset',
							value: v
						})
					}}
				/>
				</div>
				</Col>
			<Col flex="auto">
			<Slider 
				tooltip={{ formatter: null }}
				value={offsetValue}
				onChange={(v)=> {
					setOffsetValue(v)
					store.addLog('Update Offset', {offset: v})
					store.updateSnippet(snippetIdx, {
						field: 'offset',
						value: v
					})
				}}
				min={0}
				max={2000}
				step={10}
				style={{minWidth: '20em', width: '20em'}}
			/>
			</Col>
			</Row>
		<Row align="middle" style={{marginTop: '2vh', display:'none'}}>
			<Col flex="5em">
				<b>Time</b>
			</Col>
			<Col flex="auto">
			<div style={{display: 'inline-block'}}>
					<u>Offset</u> &nbsp;
				<InputNumber 
					addonAfter={<span style={{padding: 0, margin: 0}}>ms</span>}
					size="small" 
					min={0}
					style={{ width: '7em' }} 
					value={offsetValue}
					onChange={(v) => {
						setOffsetValue(v)
						store.addLog('Update Offset', {offset: v})
						store.updateSnippet(snippetIdx, {
							field: 'offset',
							value: v
						})
					}}
				/>
				</div>

				<div style={{
					display: 'inline-block',
					marginLeft: '2em'
				}}>
				<u>Delay</u> &nbsp;
				<InputNumber 
					addonAfter={<span>ms</span>}
					size="small" 
					min={0}
					style={{ width: '7em' }} 
					value={delayValue}
					onChange={(v) => {
						setDelayValue(v)
						store.addLog('Update Delay', {delay: v})
						store.updateSnippet(snippetIdx, {
							field: 'delay',
							value: v
						})
					}}
				/>
				</div>

				<div>
				<u>Duration</u> &nbsp;
				<InputNumber 
					addonAfter={<span>ms</span>}
					size="small" 
					min={50}
					style={{ width: '8em' }} 
					value={durationValue}
					onChange={(v) => {
						setDurationValue(v)
						store.addLog('Update Duration', {duration: v})
						store.updateSnippet(snippetIdx, {
							field: 'duration',
							value: v
						})
					}}
				/>
				</div>
			</Col>
		</Row>

		

	</div>;
});

export default SnippetController;