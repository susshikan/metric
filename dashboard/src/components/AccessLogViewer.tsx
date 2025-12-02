import { useEffect, useRef } from "react";
import type { LogEntry } from "../types";
import { FileText } from "lucide-react";

interface AccessLogViewerProps {
  logs: LogEntry[];
}

export default function AccessLogViewer({ logs }: AccessLogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getStatusColor = (status: string) => {
    const s = parseInt(status);
    if (s >= 500) return "text-red-400";
    if (s >= 400) return "text-yellow-400";
    if (s >= 300) return "text-blue-400";
    return "text-green-400";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-0 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900">
        <FileText className="w-4 h-4 text-zinc-400" />
        <h3 className="text-zinc-100 font-semibold text-sm">Live Access Logs</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="flex flex-col gap-1">
          {logs.map((l, i) => (
            <div key={i} className="flex gap-3 hover:bg-zinc-900/50 p-1 rounded transition-colors border-l-2 border-transparent hover:border-zinc-700">
              <span className="text-zinc-600 w-[70px] shrink-0">{l.timestamp.split(' ')[1] || l.timestamp}</span>
              <span className={`font-bold w-[40px] shrink-0 ${l.method === 'GET' ? 'text-blue-300' : 'text-orange-300'}`}>{l.method}</span>
              <span className={`font-bold w-[40px] shrink-0 ${getStatusColor(l.status)}`}>{l.status}</span>
              <span className="text-zinc-500 w-[60px] shrink-0 text-right">{l.duration}ms</span>
              <span className="text-zinc-300 truncate">{l.url}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}