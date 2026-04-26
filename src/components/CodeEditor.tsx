import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { store } from '@/store';

// @ts-expect-error: set up the monaco environment by overwriting
self.MonacoEnvironment = {
	getWorkerUrl: function (_moduleId: any, label: string) {
		if (label === 'json') {
			return './json.worker.bundle.js';
		}
		if (label === 'css' || label === 'scss' || label === 'less') {
			return './css.worker.bundle.js';
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return './html.worker.bundle.js';
		}
		if (label === 'typescript' || label === 'javascript') {
			return './ts.worker.bundle.js';
		}
		return './editor.worker.bundle.js';
	}
};

export default function CodeEditor () {
	const divEl = useRef<HTMLDivElement>(null);
	const [code, setCode] = useState(store.code);
	const [editorState, setEditorState] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

	useEffect(() => {
		if (divEl.current) {
			const editor = monaco.editor.create(divEl.current, {
				value: code,
				language: 'typescript',
				readOnly: false,
				minimap: {enabled: false},
				theme: 'vs-light',
				glyphMargin: false,
				lineNumbers: "on",
				wordWrap: "on",
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
		className="code-editor" 
		ref={divEl}
		style={{
			width: '50vw',
			height: '55vh',
		}}
	></div>;
}