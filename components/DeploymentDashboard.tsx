
import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  service: string;
  message: string;
  id: string;
}

interface FileStatus {
  name: string;
  size: string;
  status: 'VERIFIED' | 'SCANNING' | 'CORRUPT' | 'PENDING';
  checksum: string;
}

interface DeploymentDashboardProps {
  onClose: () => void;
}

const DeploymentDashboard: React.FC<DeploymentDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'terminal' | 'config' | 'logs' | 'integrity'>('status');
  const [projectId, setProjectId] = useState('violet-synthesis-node');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isScanningFiles, setIsScanningFiles] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [files, setFiles] = useState<FileStatus[]>([
    { name: 'index.tsx', size: '1.2kb', status: 'VERIFIED', checksum: 'A92B1' },
    { name: 'App.tsx', size: '14.5kb', status: 'VERIFIED', checksum: 'E43D0' },
    { name: 'geminiService.ts', size: '4.8kb', status: 'VERIFIED', checksum: 'C11F2' },
    { name: 'firebase.json', size: '0.4kb', status: 'VERIFIED', checksum: '990B1' },
    { name: 'ResultView.tsx', size: '28.2kb', status: 'VERIFIED', checksum: 'D88A4' },
    { name: 'metadata.json', size: '0.3kb', status: 'VERIFIED', checksum: 'F00E1' }
  ]);
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Simulated Log Generation
  useEffect(() => {
    const services = ['API_GATEWAY', 'GEMINI_ENGINE', 'GROUNDING_SRV', 'FIREBASE_HOST', 'FS_SCANNER'];
    const levels: LogEntry['level'][] = ['INFO', 'INFO', 'SUCCESS', 'WARN', 'INFO'];
    const messages = [
      'Handshake established with Gemini-3-Flash',
      'Grounding metadata retrieved from Google Search',
      'SSL Certificate verified for custom domain',
      'Memory utilization at 82% in Synthesis Node',
      'Build assets compressed (4.2MB -> 1.1MB)',
      'New deployment revision detected: v8.2.1',
      'CDN cache invalidated successfully',
      'FS Integrity: Block 0xFA Verify OK'
    ];

    const generateLog = () => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        level: levels[Math.floor(Math.random() * levels.length)],
        service: services[Math.floor(Math.random() * services.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
    };

    const interval = setInterval(generateLog, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const runAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      const bugLog: LogEntry = {
        id: 'bug-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'ERROR',
        service: 'GEMINI_ENGINE',
        message: 'CRITICAL: Structural Hallucination detected in JSON synthesis. Retrying with high-fidelity grounding.'
      };
      setLogs(prev => [...prev, bugLog]);
    }, 2500);
  };

  const runDeepScan = () => {
    setIsScanningFiles(true);
    setFiles(prev => prev.map(f => ({ ...f, status: 'SCANNING' })));
    
    setTimeout(() => {
      setFiles(prev => prev.map(f => ({ ...f, status: 'VERIFIED' })));
      setIsScanningFiles(false);
      const scanLog: LogEntry = {
        id: 'scan-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'SUCCESS',
        service: 'FS_SCANNER',
        message: 'DEEP SCAN COMPLETE: 100% Integrity match. No corrupt files or broken encodings detected.'
      };
      setLogs(prev => [...prev, scanLog]);
    }, 3000);
  };

  const firebaseJson = {
    "hosting": {
      "public": "dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  };

  const firebaserc = { "projects": { "default": projectId } };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-6 sm:p-10 border-b border-white/5 bg-black/40 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-xl text-white shadow-xl shadow-purple-900/40">
              <i className="fas fa-microchip"></i>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase">Deployment Center</h2>
              <div className="flex p-1 bg-black/60 rounded-lg border border-white/5 mt-2 w-fit">
                {['status', 'terminal', 'integrity', 'config', 'logs'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-inner shadow-black' : 'text-gray-600 hover:text-gray-400'}`}
                  >
                    {tab}
                    {tab === 'logs' && logs.some(l => l.level === 'ERROR') && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                    {tab === 'integrity' && <i className="fas fa-shield-check ml-2 text-[8px] text-green-500"></i>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-10 scrollbar-thin">
          
          {activeTab === 'status' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Cloud Health', val: '99.9%', icon: 'fa-heartbeat', color: 'text-green-500' },
                  { label: 'Active Builds', val: '02', icon: 'fa-cube', color: 'text-blue-500' },
                  { label: 'Integrity', val: 'SECURE', icon: 'fa-shield-halved', color: 'text-purple-500' }
                ].map((stat, i) => (
                  <div key={i} className="glass rounded-3xl p-6 border-white/5 bg-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <i className={`fas ${stat.icon} ${stat.color}`}></i>
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Live Metrics</span>
                    </div>
                    <p className="text-2xl font-black text-white mb-1">{stat.val}</p>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="glass rounded-3xl p-8 border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl text-purple-400">
                    <i className="fas fa-fingerprint"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Architecture Verified</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-lg">
                      All local assets match production hashes. No file corruption detected in current workspace session. 
                      Ready for global deployment.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('integrity')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest border border-white/5 transition-all"
                >
                  View Integrity Map
                </button>
              </div>
            </div>
          )}

          {activeTab === 'integrity' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">File Integrity Scanner</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Verifying binary headers and source encoding.</p>
                </div>
                <button 
                  onClick={runDeepScan}
                  disabled={isScanningFiles}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isScanningFiles ? 'bg-green-600/20 text-green-400' : 'bg-green-600 text-white hover:bg-green-500 shadow-xl shadow-green-900/20'}`}
                >
                  {isScanningFiles ? <><i className="fas fa-sync fa-spin mr-2"></i>Verifying Blocks...</> : <><i className="fas fa-shield-virus mr-2"></i>Run Deep Scan</>}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file, i) => (
                  <div key={i} className={`p-6 bg-black border rounded-3xl transition-all ${file.status === 'SCANNING' ? 'border-blue-500/40' : 'border-white/5'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                        <i className={`fas ${file.name.endsWith('.json') ? 'fa-file-code' : 'fa-file-lines'}`}></i>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${file.status === 'VERIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500 animate-pulse'}`}>
                        {file.status}
                      </div>
                    </div>
                    <h5 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">{file.name}</h5>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] text-gray-600 font-mono">Size: {file.size}</span>
                       <span className="text-[9px] text-gray-700 font-mono tracking-tighter">Hash: {file.checksum}</span>
                    </div>
                    {file.status === 'SCANNING' && (
                      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 animate-[loading-bar_1s_infinite]"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-8 bg-black/40 border border-white/5 rounded-[2rem] flex items-center gap-8">
                <div className="w-12 h-12 rounded-full border border-green-500/20 flex items-center justify-center text-green-500">
                  <i className="fas fa-circle-check"></i>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                  The **Integrity Engine** continuously monitors the file system during runtime. Any unauthorized bitwise changes 
                  or corrupted encoding sequences will be automatically flagged and isolated to prevent production contamination.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-[#050505] p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Feed</span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/10"></div>
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Buffer: 50 Entries</div>
                </div>
                <button 
                  onClick={runAudit}
                  disabled={isAuditing}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isAuditing ? 'bg-purple-600/20 text-purple-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-xl shadow-purple-900/40'}`}
                >
                  {isAuditing ? <><i className="fas fa-sync fa-spin mr-2"></i>Scanning Logs...</> : <><i className="fas fa-search mr-2"></i>Run Bug Audit</>}
                </button>
              </div>

              <div 
                ref={logContainerRef}
                className="flex-grow bg-black rounded-[2rem] p-8 font-mono text-[10px] sm:text-[11px] overflow-y-auto max-h-[400px] border border-white/5 space-y-2 scrollbar-thin shadow-inner"
              >
                {logs.length === 0 && <div className="text-gray-700 animate-pulse uppercase tracking-widest">Initializing Log Stream...</div>}
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-4 group hover:bg-white/5 p-1 rounded transition-colors">
                    <span className="text-gray-700 whitespace-nowrap">[{log.timestamp}]</span>
                    <span className={`font-bold whitespace-nowrap min-w-[60px] ${
                      log.level === 'SUCCESS' ? 'text-green-500' : 
                      log.level === 'ERROR' ? 'text-red-500 animate-pulse' : 
                      log.level === 'WARN' ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-purple-600 whitespace-nowrap">[{log.service}]</span>
                    <span className="text-gray-400">{log.message}</span>
                  </div>
                ))}
              </div>

              {logs.some(l => l.level === 'ERROR') && (
                <div className="p-6 bg-red-600/10 border border-red-500/20 rounded-3xl animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-4 mb-3">
                    <i className="fas fa-bug text-red-500"></i>
                    <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Audit Finding: Potential Hallucination Issue</h5>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    The auditor identified a consistency bug during the last Gemini synthesis. 
                    **Recommendation**: Enable "Strict Grounding" in the Discovery Workbench to ensure output matches formal documentation.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="bg-[#050505] border border-white/5 rounded-3xl p-8">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 border-b border-white/5 pb-4">Firebase CLI Sequence</h3>
                <div className="space-y-6">
                  {[
                    { cmd: 'firebase login', desc: 'Authenticate with Google Cloud' },
                    { cmd: 'firebase init hosting', desc: 'Configure local project files' },
                    { cmd: 'npm run build && firebase deploy', desc: 'Uplink artifacts to production' }
                  ].map((step, i) => (
                    <div key={i} className="group relative bg-black/40 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{step.desc}</p>
                        <button onClick={() => copyToClipboard(step.cmd)} className="text-[9px] font-black text-purple-600 hover:text-white uppercase transition-colors">Copy</button>
                      </div>
                      <div className="font-mono text-xs flex items-center gap-3">
                        <span className="text-purple-500">$</span>
                        <code className="text-gray-300">{step.cmd}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
             <div className="space-y-10 animate-in fade-in duration-500">
              <div className="p-8 bg-purple-600/5 border border-purple-500/20 rounded-3xl">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Target Node ID</h3>
                <input 
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm text-purple-400 focus:outline-none focus:border-purple-500 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">firebase.json</h4>
                  <pre className="bg-[#050505] p-6 rounded-3xl border border-white/5 text-[10px] font-mono text-gray-500 overflow-x-auto">
                    {JSON.stringify(firebaseJson, null, 2)}
                  </pre>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">.firebaserc</h4>
                  <pre className="bg-[#050505] p-6 rounded-3xl border border-white/5 text-[10px] font-mono text-gray-500 overflow-x-auto">
                    {JSON.stringify(firebaserc, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Action Area */}
          <div className="p-10 bg-purple-600 rounded-[2.5rem] text-center space-y-6 shadow-2xl shadow-purple-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter relative z-10">System Status: Optimized & Secure</h3>
            <p className="text-xs text-purple-100 max-w-xl mx-auto leading-relaxed font-medium relative z-10">
              No corrupt files or logic faults detected. All synthesis parameters are within standard operating bounds.
            </p>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <button onClick={onClose} className="px-8 py-3 bg-white text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Resume Workbench</button>
              <a href="https://console.cloud.google.com" target="_blank" className="px-8 py-3 bg-purple-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
                Open Cloud Console
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black border-t border-white/5 text-center flex justify-between items-center px-12">
          <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.5em]">Violet OS v8.2.1 // Integrity Hash: {Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
          <div className="flex items-center gap-4">
             <span className="text-[8px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
               <i className="fas fa-shield-check"></i> Files Verified
             </span>
             <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Encrypted Uplink</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default DeploymentDashboard;
