import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import * as d3 from 'd3'
import { observer } from 'mobx-react';


const SvgXMLEditor = observer(({xml}: {xml: string}) => {
	const divEl = useRef<HTMLDivElement>(null);
	const [code, setCode] = useState(xml);
	const [editorState, setEditorState] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);


    useEffect(() => {
        setCode(xml);
		editorState?.setValue(xml);
		editorState?.setScrollTop(0);
    }
    , [xml]);

	useEffect(() => {
		if (divEl.current) {
            d3.select(divEl.current).selectAll('*').remove();
			const editor = monaco.editor.create(divEl.current, {
				value: code,
				language: 'html',
				readOnly: true,
				minimap: { enabled: false },
				theme: 'vs-light',
				glyphMargin: false,
				lineNumbers: "on",
				wordWrap: "off",
                folding: true,
                lineDecorationsWidth: 5,
                lineHeight: 10,
                fontSize: 9
			});
			editor.getModel()?.onDidChangeContent(() => {
				setCode(editor.getValue());
			});
			setEditorState(editor);
		}
		return () => {
			editorState?.dispose();
		};
	}, []);

	return <div 
		ref={divEl}
		style={{
			width: '100%',
			height: '40vh',
		}}
	></div>;
});

export default SvgXMLEditor;