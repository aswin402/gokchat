import { useState, useEffect } from "react";
import { useArtifactStore } from "../stores/artifactStore";
import { Button } from "./ui/button";
import { Eye, Code, X, Copy, Check, RefreshCw, Maximize2, Minimize2 } from "lucide-react";

interface ArtifactViewProps {
  conversationId: string;
}

export function ArtifactView({ conversationId }: ArtifactViewProps) {
  const artifactStore = useArtifactStore();
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const conversationArtifacts = artifactStore.artifacts[conversationId] || [];
  const activeArtifact = conversationArtifacts.find(
    (a) => a.id === artifactStore.activeArtifactId
  );

  // Auto-switch to code tab if artifact type is not previewable (e.g. not HTML or SVG)
  useEffect(() => {
    if (activeArtifact && activeArtifact.type !== "html" && activeArtifact.type !== "svg") {
      setActiveTab("code");
    } else {
      setActiveTab("preview");
    }
  }, [activeArtifact?.id, activeArtifact?.type]);

  if (!artifactStore.isPanelOpen || !activeArtifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Wrap SVG in a basic HTML page if needed
  const getIframeSource = () => {
    if (activeArtifact.type === "svg") {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background-color: #f4f4f5;
                font-family: system-ui, sans-serif;
              }
              svg {
                max-width: 90%;
                max-height: 90vh;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                background: white;
                padding: 20px;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            ${activeArtifact.content}
          </body>
        </html>
      `;
    }
    return activeArtifact.content;
  };

  return (
    <div
      className={`border-l border-zinc-900 bg-zinc-950 flex flex-col h-full text-zinc-100 transition-all duration-300 shadow-2xl relative ${
        isFullscreen ? "absolute inset-0 z-50 w-full" : "w-[480px] lg:w-[600px] shrink-0"
      }`}
    >
      {/* Header */}
      <div className="h-14 border-b border-zinc-900 px-4 flex items-center justify-between shrink-0 bg-zinc-950">
        <div className="flex flex-col min-w-0">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider truncate">
            Artifact ({activeArtifact.type})
          </div>
          <div className="text-sm font-bold truncate max-w-[300px]">
            {activeArtifact.title}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Tab buttons */}
          {(activeArtifact.type === "html" || activeArtifact.type === "svg") && (
            <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex gap-0.5 mr-2">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeTab === "preview"
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeTab === "code"
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Code
              </button>
            </div>
          )}

          {/* Copy button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>

          {/* Fullscreen button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* Close button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => artifactStore.togglePanel(false)}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-hidden bg-zinc-900/40 relative">
        {/* Streaming/Loading Indicator */}
        {!activeArtifact.isComplete && (
          <div className="absolute top-3 right-3 bg-zinc-950/80 border border-zinc-800 rounded-full px-2.5 py-1 text-[10px] text-zinc-300 font-medium flex items-center gap-1.5 shadow-lg z-10">
            <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
            Generating...
          </div>
        )}

        {activeTab === "preview" ? (
          <div className="w-full h-full bg-white relative">
            <iframe
              key={activeArtifact.id + (activeArtifact.isComplete ? "-complete" : "-streaming")}
              srcDoc={getIframeSource()}
              sandbox="allow-scripts"
              className="w-full h-full border-0"
              title="Artifact Preview"
            />
          </div>
        ) : (
          <pre className="w-full h-full p-4 overflow-auto font-mono text-xs text-zinc-300 bg-zinc-950 selection:bg-zinc-850">
            <code>{activeArtifact.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
