// frontend/src/App.js
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python3");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (value) => {
    setCode(value);
    socket.emit("code-change", value);
  };

  useEffect(() => {
    socket.on("update-code", (newCode) => {
      setCode(newCode);
    });
    return () => socket.off("update-code");
  }, []);

  const handleLanguageChange = (e) => setLanguage(e.target.value);

  const getLanguageExtension = () => {
    switch (language) {
      case "python3":
        return python();
      case "nodejs":
        return javascript();
      case "java":
        return java();
      case "cpp":
        return cpp();
      default:
        return javascript();
    }
  };

  const runCode = async () => {
    setIsLoading(true);
    setOutput("Running...");

    try {
      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });

      const data = await res.json();

      if (data.run) {
        setOutput(data.run.output || data.run.stdout || data.run.stderr || "No output");
      } else {
        setOutput("No response received.");
      }
    } catch (err) {
      setOutput("Error executing code.");
    }

    setIsLoading(false);
  };

  return (
    <div className="App">
      <h1>Real-time Code Editor</h1>

      <div className="language-selector">
        <label htmlFor="language">Choose Language: </label>
        <select id="language" value={language} onChange={handleLanguageChange}>
          <option value="python3">Python</option>
          <option value="nodejs">JavaScript (Node.js)</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      <div className="editor-container">
        <CodeMirror
          value={code}
          height="400px"
          theme="dark"
          extensions={[getLanguageExtension()]}
          onChange={handleChange}
        />
      </div>

      <button className="run-button" onClick={runCode} disabled={isLoading}>
        {isLoading ? "Running..." : "Run Code"}
      </button>


      <div className="output-container">
        <h2>Output:</h2>
        <pre>{output}</pre>
      </div>
    </div>
  );
}

export default App;
