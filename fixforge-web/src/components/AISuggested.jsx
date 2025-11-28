import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  AlertCircle, 
  Code2, 
  CheckCircle2, 
  Bug, 
  Image as ImageIcon,
  Copy,
  Check,
  Loader2,
  ArrowLeft
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function AISuggested() {
  const { bugId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedBlocks, setCopiedBlocks] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`https://shy6565-fixforge-backend.hf.space
/aisuggested/${bugId}`);
        const responseData = await res.json();
        
        if (!res.ok) {
          setError(responseData.detail || "Failed to get AI suggestion");
          setLoading(false);
          return;
        }
        
        setData(responseData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load AI suggestion:", err);
        setError("❌ Failed to load AI suggestion. Please try again.");
        setLoading(false);
      }
    }
    load();
  }, [bugId]);

  const copyToClipboard = (code, blockId) => {
    navigator.clipboard.writeText(code);
    setCopiedBlocks({ ...copiedBlocks, [blockId]: true });
    setTimeout(() => {
      setCopiedBlocks({ ...copiedBlocks, [blockId]: false });
    }, 2000);
  };

  // Custom renderer for markdown code blocks
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      const blockId = Math.random().toString(36).substr(2, 9);
      
      return !inline && match ? (
        <div className="relative group my-4">
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={() => copyToClipboard(codeString, blockId)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
            >
              {copiedBlocks[blockId] ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            className="rounded-lg !mt-0"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 pb-3 border-b-2 border-purple-200">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-gray-700 leading-relaxed mb-4">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="ml-4">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-50 text-gray-700 italic">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a href={href} className="text-purple-600 hover:text-purple-700 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 border border-purple-200 shadow-xl shadow-purple-100/50">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🤖 Analyzing Bug...
            </h2>
            <p className="text-gray-600 text-center">
              AI is generating a comprehensive fix for your bug
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-red-200 shadow-xl shadow-red-100/50">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-2">
                Error Loading Suggestion
              </h2>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-full p-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">AI Suggested Fix</h1>
        </div>
        <p className="text-gray-600 ml-14">
          Powered by {data?.model_used || 'Gemini AI'}
        </p>
      </div>

      {/* Bug Context Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg shadow-purple-100/50 mb-6">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 rounded-full p-3">
            <Bug className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {data?.title}
            </h2>
            <div className="flex flex-wrap gap-3">
              {data?.category && (
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  {data.category}
                </span>
              )}
              {data?.client_type && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {data.client_type}
                </span>
              )}
              {data?.severity && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  data.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                  data.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                  data.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {data.severity}
                </span>
              )}
              {data?.has_code && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Code2 className="w-3 h-3" />
                  Code Included
                </span>
              )}
              {data?.has_screenshot && (
                <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Screenshot Analyzed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-purple-200 shadow-xl shadow-purple-100/50">
        <div className="prose prose-purple max-w-none">
          <ReactMarkdown components={MarkdownComponents}>
            {data?.suggestion || "No suggestion available"}
          </ReactMarkdown>
        </div>
      </div>

      {/* Action Buttons */}
      {/* Action Buttons */}
<div className="mt-6 flex gap-4">
  <button
    onClick={() => {
      // Navigate to post solution with pre-filled content
      navigate('/post-solution', {
        state: {
          bugId: bugId,
          title: data?.title || '',
          content: data?.suggestion || '',
          fromAI: true
        }
      });
    }}
    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-purple-300/50 hover:shadow-purple-400/60 flex items-center justify-center gap-2"
  >
    <CheckCircle2 className="w-5 h-5" />
    Post This Solution
  </button>
  <button
    onClick={() => navigate('/submit')}
    className="flex-1 bg-white hover:bg-gray-50 text-purple-700 border-2 border-purple-300 px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
  >
    <Bug className="w-5 h-5" />
    Submit Another Bug
  </button>
</div>

    </div>
  );
}
