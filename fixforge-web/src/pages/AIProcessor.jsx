import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, Code2 } from "lucide-react";

export default function AIProcessor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAISuggestion = async () => {
      try {
        const { bugId, bugTitle, bugDescription } = location.state || {};
        
        if (!bugId) {
          setError("No bug ID provided");
          setStatus("error");
          return;
        }

        console.log('🔵 Fetching AI suggestion for bug:', bugId);
        setStatus("processing");

        // Call your backend API that uses Gemini
        const response = await fetch(`https://shy6565-fixforge-backend.hf.space
/aisuggested/${bugId}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Received structured data:', data);

        // ✅ Data is already structured from Gemini with JSON schema
        const parsedSuggestion = JSON.parse(data.suggestion);
        
        // Extract the first code patch (you can handle multiple patches)
        const firstPatch = parsedSuggestion.code_patches?.[0] || {};
        
        const result = {
          bugId,
          title: bugTitle || data.title,
          explanation: parsedSuggestion.explanation || "",
          rootCause: parsedSuggestion.root_cause || "",
          debuggingSteps: parsedSuggestion.debugging_checklist || [],
          originalCode: "", // Gemini doesn't provide original, use bug description
          fixedCode: firstPatch.code || "",
          codeLanguage: firstPatch.language || "javascript",
          filename: firstPatch.filename || "",
          patchDescription: firstPatch.description || "",
          allPatches: parsedSuggestion.code_patches || [],
          modelUsed: data.model_used,
          fromAI: true
        };

        console.log('✅ Extracted result:', {
          hasBugId: !!result.bugId,
          hasTitle: !!result.title,
          explanationLength: result.explanation.length,
          fixedCodeLength: result.fixedCode.length,
          modelUsed: result.modelUsed
        });

        setExtracted(result);
        setStatus("success");

        // Navigate to solution form after 1.5 seconds
        setTimeout(() => {
          console.log('🚀 Navigating to /post-solution');
          navigate("/post-solution", { state: result });
        }, 1500);

      } catch (error) {
        console.error("❌ AI processing error:", error);
        setError(error.message);
        setStatus("error");
      }
    };

    fetchAISuggestion();
  }, [location.state, navigate]);

  if (status === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            AI Processing
          </h2>
          <p className="text-gray-600">
            Gemini 2.5 Flash is analyzing your bug and generating a solution...
          </p>
        </div>
      </div>
    );
  }

  if (status === "success" && extracted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Solution Extracted!
          </h2>
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-sm text-gray-700">
                Extracted Components:
              </span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Root cause analysis</li>
              <li>✅ Code fix ({extracted.codeLanguage})</li>
              <li>✅ Explanation</li>
              <li>✅ Debugging steps ({extracted.debuggingSteps.length})</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              Model: {extracted.modelUsed}
            </p>
          </div>
          <p className="text-gray-600">Redirecting to solution form...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Processing Failed
          </h2>
          <p className="text-gray-600 mb-4">{error || "Could not process AI suggestion"}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
