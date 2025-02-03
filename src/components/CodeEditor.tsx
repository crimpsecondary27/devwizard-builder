import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Cleanup existing models
      console.log("Cleaning up existing Monaco models");
      monaco.editor.getModels().forEach(model => model.dispose());
    }

    return () => {
      // Cleanup on unmount
      if (editorRef.current) {
        console.log("Disposing Monaco Editor");
        editorRef.current.dispose();
      }
      // Cleanup any remaining models
      monaco.editor.getModels().forEach(model => model.dispose());
    };
  }, []);

  const handleEditorWillMount = (monacoEditor: typeof monaco) => {
    console.log("Monaco Editor will mount");
    monacoRef.current = monacoEditor;
    
    try {
      // Create a new model if needed
      const modelUri = monacoEditor.Uri.parse(`file:///workspace/code.${language}`);
      const existingModel = monacoEditor.editor.getModel(modelUri);
      
      if (!existingModel) {
        console.log("Creating new Monaco model");
        monacoEditor.editor.createModel(code, language, modelUri);
      } else {
        console.log("Using existing Monaco model");
        existingModel.setValue(code);
      }
    } catch (error) {
      console.error("Error initializing Monaco model:", error);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    console.log("Monaco Editor mounted");
    editorRef.current = editor;
  };

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