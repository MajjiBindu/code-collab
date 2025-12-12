import React, { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import "./App.css";
import { io } from "socket.io-client";

function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python3");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  const emitTimer = useRef(null);

  // Create socket inside effect; cleanup on unmount
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("update-code", (newCode) => {
      setCode(newCode);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleChange = (value) => {
    setCode(value);

    // Debounced emit (300ms)
    if (emitTimer.current) clearTimeout(emitTimer.current);
    emitTimer.current = setTimeout(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("code-change", value);
      }
    }, 300);
  };

  useEffect(() => {
    // cleanup timer on unmount
    return () => {
      if (emitTimer.current) clearTimeout(emitTimer.current);
    };
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

  // Improved runCode with better error visibility
  const runCode = async () => {
    setIsLoading(true);
    setOutput("Running...");

    try {
      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setOutput(`Server returned non-JSON (status ${res.status}):\n\n${text}`);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setOutput(`Server error (status ${res.status}): ${data.error || JSON.stringify(data)}`);
        setIsLoading(false);
        return;
      }

      const out = data.run?.stdout ?? data.run?.stderr ?? data.run?.output ?? "No output";
      setOutput(out || "No output");
    } catch (err) {
      setOutput(`Network/fetch error: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="app-title">Real time Code Editor</h1>
      </header>

      <div className="controls-row">
        <label htmlFor="language" className="lang-label">
          Choose Language:
        </label>
        <select id="language" value={language} onChange={handleLanguageChange} className="lang-select">
          <option value="python3">Python</option>
          <option value="nodejs">JavaScript (Node.js)</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <button className="run-button" onClick={runCode} disabled={isLoading}>
          {isLoading ? "Running..." : "▶ Run Code"}
        </button>
      </div>

      <div className="editor-container">
        <CodeMirror
          value={code}
          height="520px"
          theme={dracula}
          extensions={[getLanguageExtension()]}
          onChange={handleChange}
        />
      </div>

      <div className="output-section bottom-output">
        <h2>Output</h2>
        <pre className="output-pre">{output}</pre>
      </div>
    </div>
  );
}

export default App;