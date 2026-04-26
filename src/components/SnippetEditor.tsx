import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { store } from '@/store';
import * as d3 from 'd3';
import { observer } from 'mobx-react';

interface SnippetEditorProps {
    snippetCode: string,
    callback: (newV: string) => void,
    width?: number,
    height?: number | string,
	language?: string
}

const SnippetEditor = observer(({snippetCode, callback, height, language}: SnippetEditorProps) => {
	const divEl = useRef<HTMLDivElement>(null);
	const [code, setCode] = useState(snippetCode);
	const [editorState, setEditorState] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

	useEffect(() => {
		if (divEl.current) {
			divEl.current.style.width = '100%';
			if (editorState) {
				editorState.layout();
			}
		}
	}, [store.rightPanelPixel]);

	useEffect(() => {
		if (divEl.current) {
            if (d3.select(divEl.current).select('.monaco-editor').node()) return;
			monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
				noSemanticValidation: true,
				noSyntaxValidation: true,
				noSuggestionDiagnostics: true,
			});

			const editor = monaco.editor.create(divEl.current, {
				value: code,
				language: language ?? 'javascript',
				readOnly: false,
				minimap: {enabled: false},
				theme: 'vs-light',
				glyphMargin: false,
				lineNumbers: "on",
				wordWrap: "on",
                lineDecorationsWidth: 5,
                lineHeight: 12,
                fontSize: 13,
			});
	
			editor.getModel()?.onDidChangeContent(() => {
                const newV = editor.getValue()
				setCode(newV);
                callback(newV)
			});

			setEditorState(editor);
			setTimeout(() => {
				editor.layout();
			}, 50)
		}
		return () => {
			editorState?.dispose();
		};
	}, []);

    useEffect(() => {
		if (editorState && snippetCode !== code) {
			editorState.setValue(snippetCode);
		}
    }, [snippetCode])

	return <div 
		ref={divEl}
		style={{
			width: '100%',
			height: height ??'35vh',
            minHeight: '20vh',
			padding: '0 5px 0',
			textAlign: 'left'
		}}
	></div>;
});


export default SnippetEditor;