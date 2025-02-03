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

  // Cleanup function
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        console.log("Disposing Monaco Editor");
        editorRef.current.dispose();
      }
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
    
    // Ensure we have a valid Monaco instance
    if (!monacoRef.current) {
      console.error("Monaco instance not available");
      return;
    }

    try {
      // Create a unique model URI for this instance
      const modelUri = monacoRef.current.Uri.parse(`file:///workspace/code.${language}`);
      
      // Check for existing model and dispose if found
      let model = monacoRef.current.editor.getModel(modelUri);
      if (model) {
        console.log("Disposing existing model");
        model.dispose();
      }
      
      // Create new model
      console.log("Creating new Monaco model");
      model = monacoRef.current.editor.createModel(code, language, modelUri);
      
      // Set the model to the editor
      editor.setModel(model);
      setIsEditorReady(true);
      
      console.log("Model setup complete");
    } catch (error) {
      console.error("Error initializing Monaco model:", error);
    }
  };

  // Update model content when code prop changes
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