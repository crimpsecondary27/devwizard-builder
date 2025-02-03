import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
}

const CodeEditor = ({ code, language = "typescript", onChange }: CodeEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup function
      if (editorRef.current) {
        console.log("Disposing Monaco Editor");
        editorRef.current.dispose();
      }
      // Cleanup any remaining models
      if (monacoRef.current) {
        console.log("Cleaning up Monaco models");
        monacoRef.current.editor.getModels().forEach(model => model.dispose());
      }
    };
  }, []);

  const handleEditorWillMount = (monacoEditor: typeof monaco) => {
    console.log("Monaco Editor will mount");
    monacoRef.current = monacoEditor;
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    console.log("Monaco Editor mounted");
    editorRef.current = editor;

    try {
      // Get or create model
      const modelUri = monaco.Uri.parse(`file:///workspace/code.${language}`);
      let model = monaco.editor.getModel(modelUri);
      
      if (!model) {
        console.log("Creating new Monaco model");
        model = monaco.editor.createModel(code, language, modelUri);
      } else {
        console.log("Updating existing Monaco model");
        model.setValue(code);
      }
      
      editor.setModel(model);
      setIsEditorReady(true);
    } catch (error) {
      console.error("Error initializing Monaco model:", error);
    }
  };

  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== code) {
        model.setValue(code);
      }
    }
  }, [code, isEditorReady]);

  return (
    <div className="h-[400px] w-full border border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          readOnly: false,
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;