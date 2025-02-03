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

  useEffect(() => {
    // Ensure Monaco is properly initialized
    if (typeof window !== "undefined") {
      console.log("Initializing Monaco Editor");
      monaco.editor.getModels().forEach(model => model.dispose());
    }
    return () => {
      // Cleanup on unmount
      if (editorRef.current) {
        console.log("Disposing Monaco Editor");
        editorRef.current.dispose();
      }
    };
  }, []);

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