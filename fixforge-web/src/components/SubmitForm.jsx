import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FindingSolutionsModal from "./FindingSolutionsModal";
import { Upload, X, Code2, FileCode } from "lucide-react";
import { useUserContext } from "../context/UserContext";

export default function SubmitForm() {
  const API_BASE = "https://shy6565-fixforge-backend.hf.space
";

  const navigate = useNavigate();
  const { user } = useUserContext();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [clientType, setClientType] = useState("Web");
  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState("");
  const [finding, setFinding] = useState(false);

  // ✅ NEW: Code editor state
  const [code, setCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  // ✅ NEW: Handle code file upload
  const handleCodeFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target.result);
        setShowCodeEditor(true);
        
        // Auto-detect language from file extension
        const ext = file.name.split('.').pop().toLowerCase();
        const langMap = {
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'py': 'python',
          'java': 'java',
          'cpp': 'cpp',
          'c': 'c',
          'cs': 'csharp',
          'rb': 'ruby',
          'go': 'go',
          'rs': 'rust',
          'php': 'php',
          'html': 'html',
          'css': 'css',
          'json': 'json',
          'xml': 'xml',
          'sql': 'sql'
        };
        setCodeLanguage(langMap[ext] || 'javascript');
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("severity", severity);
    formData.append("clientType", clientType);
    formData.append("tags", JSON.stringify(tag ? [tag] : []));
    if (user && user.id) formData.append("user_id", user.id);
    if (screenshot) formData.append("screenshot", screenshot);
    
    // ✅ NEW: Append code if provided
    if (code.trim()) {
      formData.append("code", code);
      formData.append("code_language", codeLanguage);
    }

    try {
      const res = await fetch(`${API_BASE}/bugs/submit`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to submit bug");
      const data = await res.json();
      setStatus("✅ Bug submitted successfully!");
      // After bug submission success (around line 91):
navigate(`/ai-process`, { 
  state: { 
    bugId: data.bug_id,
    bugTitle: title,
    bugDescription: description
  } 
});


      if (data.is_duplicate && data.has_solutions) {
        navigate(`/related-solutions/${data.bug_id}`);
      } else {
        navigate(`/ai-suggested/${data.bug_id}`);
      }

      if (data.bug_id) {
        setFinding(true);
        try {
          const clusterRes = await fetch(
            `${API_BASE}/clusters/${data.bug_id}/suggestions`
          );
          const clusterData = await clusterRes.json();
          setFinding(false);

          if (clusterData.has_related) {
            navigate(`/related/${data.bug_id}`);
          } else {
            navigate(`/aisuggested/${data.bug_id}`);
          }
        } catch (err) {
          console.error("Cluster check failed:", err);
          setFinding(false);
          navigate(`/aisuggested/${data.bug_id}`);
        }
      }

      // Reset
      setTitle("");
      setDescription("");
      setTag("");
      setSeverity("Low");
      setClientType("Web");
      setScreenshot(null);
      setCode("");
      setShowCodeEditor(false);
    } catch (err) {
      console.error(err);
      setStatus("❌ Submission failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-gray-900 text-4xl mb-8">Submit Bug Report</h1>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-purple-200 shadow-xl shadow-purple-100/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-gray-900 mb-2">
              Bug Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for the bug"
              className="w-full bg-white text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-900 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the bug, steps to reproduce, and expected vs actual behavior"
              rows={6}
              className="w-full bg-white text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-gray-900 mb-2">Tags</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full bg-white text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="">Select bug category</option>
              <option value="UI">UI</option>
              <option value="API">API</option>
              <option value="Auth">Auth</option>
              <option value="Database">Database</option>
              <option value="Performance">Performance</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-gray-900 mb-2">Severity</label>
            <div className="flex flex-wrap gap-3">
              {["Low", "Medium", "High", "Critical"].map((level) => (
                <label
                  key={level}
                  className={`flex items-center px-5 py-3 rounded-lg border cursor-pointer transition-all ${
                    severity === level
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-500 shadow-md"
                      : "bg-white text-gray-700 border-purple-300 hover:border-purple-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={level}
                    checked={severity === level}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="sr-only"
                    required
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Client Type */}
          <div>
            <label className="block text-gray-900 mb-2">Client Type</label>
            <div className="flex flex-wrap gap-3">
              {["Web", "Extension", "Desktop"].map((type) => (
                <label
                  key={type}
                  className={`flex items-center px-5 py-3 rounded-lg border cursor-pointer transition-all ${
                    clientType === type
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-500 shadow-md"
                      : "bg-white text-gray-700 border-purple-300 hover:border-purple-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="clientType"
                    value={type}
                    checked={clientType === type}
                    onChange={(e) => setClientType(e.target.value)}
                    className="sr-only"
                    required
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ✅ NEW: Code Editor Section */}
          <div>
            <label className="block text-gray-900 mb-2">
              Code (optional)
            </label>
            
            {!showCodeEditor ? (
              <div className="space-y-3">
                <input
                  id="code-file"
                  type="file"
                  accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.rb,.go,.rs,.php,.html,.css,.json,.xml,.sql,.txt"
                  onChange={handleCodeFileUpload}
                  className="hidden"
                />
                
                <div className="flex gap-3">
                  <label
                    htmlFor="code-file"
                    className="flex-1 flex items-center justify-center bg-white text-gray-700 border-2 border-dashed border-purple-300 rounded-lg px-4 py-4 cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
                  >
                    <FileCode className="w-5 h-5 text-purple-600 mr-2" />
                    <span>Upload code file</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setShowCodeEditor(true)}
                    className="flex-1 flex items-center justify-center bg-white text-gray-700 border-2 border-dashed border-purple-300 rounded-lg px-4 py-4 cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
                  >
                    <Code2 className="w-5 h-5 text-purple-600 mr-2" />
                    <span>Write code manually</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="bg-white text-gray-900 rounded-lg px-3 py-2 border border-purple-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="csharp">C#</option>
                    <option value="ruby">Ruby</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="php">PHP</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="sql">SQL</option>
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setCode("");
                      setShowCodeEditor(false);
                    }}
                    className="text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">Remove code</span>
                  </button>
                </div>
                
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or type your code here..."
                  rows={15}
                  className="w-full bg-gray-900 text-green-400 font-mono text-sm rounded-lg px-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                />
                
                {code.trim() && (
                  <div className="text-sm text-gray-600">
                    {code.split('\n').length} lines • {code.length} characters
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Screenshot */}
          <div>
            <label className="block text-gray-900 mb-2">Screenshot (optional)</label>
            <div className="relative">
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="screenshot"
                className="flex items-center justify-center w-full bg-white text-gray-700 border-2 border-dashed border-purple-300 rounded-lg px-4 py-6 cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <span className="text-gray-700">
                    {screenshot ? screenshot.name : "Click to upload screenshot"}
                  </span>
                </div>
              </label>

              {screenshot && (
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-lg border border-purple-500 transition-all shadow-lg shadow-purple-300/50 hover:shadow-purple-400/60"
            >
              Submit Bug Report
            </button>
          </div>
        </form>

        {status && (
          <p className="mt-4 text-center text-sm font-medium text-gray-700">{status}</p>
        )}
      </div>

      <FindingSolutionsModal show={finding} />
    </div>
  );
}
