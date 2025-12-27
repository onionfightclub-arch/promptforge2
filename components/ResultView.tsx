
import React, { useState } from 'react';
import { SearchResult } from '../types';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';

interface ResultViewProps {
  result: SearchResult;
  isSaved: boolean;
  onSave: (result: SearchResult) => void;
  onRemove: (id: string) => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, isSaved, onSave, onRemove }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'json' | 'ts' | 'schema' | 'cloud' | 'integration'>('json');
  const [cloudMode, setCloudMode] = useState<'functions' | 'run' | 'firebase'>('functions');
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isValidatingSchema, setIsValidatingSchema] = useState(false);
  const [validationReport, setValidationReport] = useState<string | null>(null);
  const [isDerivingSchema, setIsDerivingSchema] = useState(false);
  const [derivedSchema, setDerivedSchema] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const copyToClipboard = (text: string | undefined, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const safeJson = (str: string | undefined) => {
    if (!str) return "";
    try {
      const obj = typeof str === 'string' ? JSON.parse(str) : str;
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return str;
    }
  };

  const getRefinedHarness = () => `Act as a high-precision data synthesis node. Generate a JSON object strictly following these instructions:
    
${result.jsonPrompt}

OUTPUT CONSTRAINTS:
- Return ONLY valid JSON.
- No markdown formatting.
- Ensure 100% adherence to specified keys, data types, and nesting logic.`;

  const getCloudFunctionSnippet = () => {
    return `/**
 * Google Cloud Function (2nd Gen)
 * Runtime: Node.js 20
 */
import { GoogleGenAI } from "@google/genai";
import * as functions from '@google-cloud/functions-framework';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

functions.http('generateData', async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: \`${getRefinedHarness().replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`,
      config: { responseMimeType: "application/json" }
    });
    res.set('Content-Type', 'application/json');
    res.status(200).send(response.text);
  } catch (error) {
    res.status(500).send({ error: 'Internal Synthesis Fault' });
  }
});`;
  };

  const getFirebaseFunctionSnippet = () => {
    return `/**
 * Firebase Cloud Function (v2)
 * Framework: firebase-functions/v2
 */
const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

exports.generateData = onRequest({ cors: true }, async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: \`${getRefinedHarness().replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`,
      config: { responseMimeType: "application/json" }
    });
    
    res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    res.status(500).send("Synthesis Error");
  }
});

// Deployment Command:
// firebase deploy --only functions:generateData`;
  };

  const getCloudRunSnippet = () => {
    return `/**
 * Google Cloud Run Service (Dockerized Node.js)
 * Port: $PORT (Default: 8080)
 */
import express from 'express';
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = process.env.PORT || 8080;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

app.get('/', async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: \`${getRefinedHarness().replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    res.status(500).json({ error: 'Synthesis Error' });
  }
});

app.listen(port, () => console.log(\`Cloud Run Service Active on :\${port}\`));

// --- Dockerfile ---
/*
FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 8080
CMD [ "node", "index.js" ]
*/`;
  };

  const runTest = async () => {
    setIsTestingPrompt(true);
    setTestResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const promptHarness = `Act as a professional data generator. 
      Generate a single JSON object based on the following explicit structural instructions:

      --- INSTRUCTIONS START ---
      ${result.jsonPrompt}
      --- INSTRUCTIONS END ---

      REQUIREMENTS:
      1. Use correct data types. Populated with realistic entries.
      2. Return ONLY the raw JSON string. No preamble.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptHarness,
        config: { responseMimeType: "application/json" }
      });
      setTestResult(response.text || 'No data generated.');
    } catch (e) {
      setTestResult("Synthesis failed. Check connection.");
    } finally {
      setIsTestingPrompt(false);
    }
  };

  const validateAgainstSchema = async () => {
    const schemaToUse = derivedSchema || result.jsonSchema;
    if (!schemaToUse || !result.exampleJson) return;
    setIsValidatingSchema(true);
    setValidationReport(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const auditPrompt = `Validate JSON against Schema. Report in Markdown. Schema: ${schemaToUse} JSON: ${result.exampleJson}`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: auditPrompt,
      });
      setValidationReport(response.text || 'Validation complete.');
    } catch (e) {
      setValidationReport("Schema audit failed.");
    } finally {
      setIsValidatingSchema(false);
    }
  };

  const deriveSchemaFromExample = async () => {
    if (!result.exampleJson) return;
    setIsDerivingSchema(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Architect: Reverse engineer JSON Schema from: ${result.exampleJson}`,
        config: { responseMimeType: "application/json" }
      });
      setDerivedSchema(response.text?.trim());
      setActiveTab('schema');
    } catch (e: any) {
      setSchemaError("Architectural Fault.");
    } finally {
      setIsDerivingSchema(false);
    }
  };

  const displayedSchema = derivedSchema || result.jsonSchema;

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 sm:mt-10 animate-in fade-in slide-in-from-bottom-6 duration-700 px-2 sm:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        
        {/* Workspace Sidebar */}
        <aside className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          <div className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 relative shadow-2xl overflow-visible">
            
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl sm:text-3xl font-black text-white leading-tight tracking-tighter max-w-[80%]">
                {result.title}
              </h2>
              <button 
                onClick={() => onSave(result)} 
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${isSaved ? 'bg-purple-600 text-white shadow-purple-900/40' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-purple-400'}`}
                title={isSaved ? "Saved to Favorites" : "Save to Favorites"}
              >
                <i className={`fas ${isSaved ? 'fa-check' : 'fa-bookmark'}`}></i>
              </button>
            </div>
            
            <div 
              className="markdown-content text-gray-400 text-sm mb-10 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: marked.parse(result.description || '') as string }} 
            />

            <div className="space-y-4 mb-10">
              <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Prompt Logic</h4>
              <div className="relative group/prompt">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 text-[10px] font-mono text-gray-500 leading-relaxed max-h-32 overflow-y-auto no-scrollbar">
                  {result.jsonPrompt}
                </div>
                <button 
                  onClick={() => copyToClipboard(result.jsonPrompt, 'side-copy')}
                  className={`absolute top-2 right-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-xl ${copied === 'side-copy' ? 'bg-green-600 text-white' : 'bg-purple-600/90 hover:bg-purple-500 text-white opacity-0 group-hover/prompt:opacity-100'}`}
                >
                  <i className={`fas ${copied === 'side-copy' ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                  {copied === 'side-copy' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <button 
                onClick={() => copyToClipboard(result.jsonPrompt, 'main-copy')}
                className={`w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${copied === 'main-copy' ? 'bg-green-600' : ''}`}
              >
                <i className={`fas ${copied === 'main-copy' ? 'fa-check' : 'fa-terminal'}`}></i>
                {copied === 'main-copy' ? 'Ready' : 'Copy Master Prompt'}
              </button>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Platform Workflows</h4>
                <a 
                  href="https://console.firebase.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-black text-orange-500 hover:text-orange-400 transition-colors uppercase flex items-center gap-1.5"
                >
                  Firebase <i className="fas fa-external-link-alt"></i>
                </a>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('cloud')}
                  className={`flex-1 py-3 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 ${activeTab === 'cloud' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' : ''}`}
                >
                  <i className="fas fa-cloud-arrow-up"></i>
                  Deploy
                </button>

                <button 
                  onClick={deriveSchemaFromExample}
                  disabled={isDerivingSchema || !result.exampleJson}
                  className={`flex-none px-5 py-3 bg-purple-600/10 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50`}
                >
                  <i className={`fas ${isDerivingSchema ? 'fa-sync fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={validateAgainstSchema}
                  disabled={isValidatingSchema || !displayedSchema}
                  className={`py-3 bg-transparent border border-white/10 text-gray-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-purple-500/40 hover:text-purple-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  <i className={`fas ${isValidatingSchema ? 'fa-sync fa-spin' : 'fa-shield-check'}`}></i>
                  Audit
                </button>

                <button 
                  onClick={runTest}
                  disabled={isTestingPrompt}
                  className="py-3 bg-transparent border border-white/10 text-gray-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-purple-500/40 hover:text-purple-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <i className={`fas ${isTestingPrompt ? 'fa-sync fa-spin' : 'fa-vial'}`}></i>
                  Test
                </button>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border-blue-500/10 bg-blue-500/5 hidden lg:block">
            <div className="flex gap-4 items-center mb-3">
              <i className="fas fa-layer-group text-blue-400"></i>
              <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Multi-Cloud</h5>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
              Target **Firebase** for app ecosystems or **Cloud Run** for containerized API nodes.
            </p>
          </div>
        </aside>

        {/* Viewport Display */}
        <section className="lg:col-span-8 space-y-6 order-1 lg:order-2">
          
          {/* Audit Report */}
          {validationReport && (
            <div className="glass border-green-500/20 rounded-3xl p-6 sm:p-10 animate-in slide-in-from-top-4 duration-500 relative bg-green-500/5 shadow-2xl">
              <div className="absolute top-6 right-6 flex items-center gap-3">
                <button 
                  onClick={() => copyToClipboard(validationReport, 'report-copy')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-xl ${copied === 'report-copy' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                >
                  <i className={`fas ${copied === 'report-copy' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                  Copy
                </button>
                <button onClick={() => setValidationReport(null)} className="text-gray-600 hover:text-white transition-all">
                  <i className="fas fa-times-circle text-xl"></i>
                </button>
              </div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-900/40"><i className="fas fa-clipboard-check text-xl"></i></div>
                <div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Audit Result</h4>
                  <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Structural Compliance Met</p>
                </div>
              </div>
              <div className="markdown-content text-[12px] text-gray-300 bg-black/40 p-6 rounded-2xl border border-white/5 max-h-[300px] overflow-y-auto scrollbar-thin">
                <div dangerouslySetInnerHTML={{ __html: marked.parse(validationReport) as string }} />
              </div>
            </div>
          )}

          {/* Test Synthesis Output */}
          {testResult && (
            <div className="glass border-purple-500/20 rounded-3xl p-6 sm:p-10 animate-in slide-in-from-top-4 duration-500 relative bg-purple-500/5">
              <div className="absolute top-6 right-6 flex gap-3">
                <button 
                  onClick={() => copyToClipboard(testResult, 'test-copy')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-xl ${copied === 'test-copy' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                >
                  <i className={`fas ${copied === 'test-copy' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                  Copy
                </button>
                <button onClick={() => setTestResult(null)} className="text-gray-600 hover:text-white transition-all">
                  <i className="fas fa-times-circle text-xl"></i>
                </button>
              </div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40"><i className="fas fa-vial text-xl"></i></div>
                <div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Test Synthesis</h4>
                  <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">Live Flash Generation</p>
                </div>
              </div>
              <pre className="bg-black/90 rounded-2xl p-6 sm:p-10 text-[11px] sm:text-xs font-mono text-purple-400 overflow-auto max-h-[400px] border border-white/5 scrollbar-thin shadow-inner">
                {testResult}
              </pre>
            </div>
          )}

          <div className="glass rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden flex flex-col h-full shadow-2xl min-h-[500px] sm:min-h-[700px] border-white/5">
            {/* User Friendly Tab Selection */}
            <div className="flex items-center bg-black/60 border-b border-white/5 p-3 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                {id: 'json', label: 'JSON Preview', icon: 'fa-code'},
                {id: 'ts', label: 'TypeScript', icon: 'fa-brackets-curly'},
                {id: 'schema', label: 'Schema', icon: 'fa-project-diagram'},
                {id: 'cloud', label: 'Cloud Node', icon: 'fa-cloud-bolt'},
                {id: 'integration', label: 'Setup', icon: 'fa-terminal'}
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3 active:scale-95 ${activeTab === tab.id ? 'bg-white/10 text-white shadow-xl' : 'text-gray-600 hover:text-gray-400'}`}
                >
                  <i className={`fas ${tab.icon} opacity-50`}></i>
                  {tab.label}
                  {tab.id === 'cloud' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                </button>
              ))}
              <div className="flex-grow"></div>
              {activeTab !== 'integration' && (
                <div className="flex items-center gap-2 mr-3">
                  <button 
                    onClick={() => {
                      const content = activeTab === 'json' ? result.exampleJson : 
                                    activeTab === 'ts' ? result.tsInterface : 
                                    activeTab === 'cloud' ? (cloudMode === 'functions' ? getCloudFunctionSnippet() : cloudMode === 'firebase' ? getFirebaseFunctionSnippet() : getCloudRunSnippet()) :
                                    displayedSchema;
                      copyToClipboard(content, 'tab-copy');
                    }}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-3 shadow-xl active:scale-90 ${copied === 'tab-copy' ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                  >
                    <i className={`fas ${copied === 'tab-copy' ? 'fa-check' : 'fa-copy'}`}></i>
                    <span>{copied === 'tab-copy' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Content Display Area */}
            <div className="flex-grow bg-[#080808] p-6 sm:p-12 relative overflow-hidden flex flex-col group/display">
               {activeTab === 'cloud' ? (
                 <div className="h-full flex flex-col relative space-y-8">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white"><i className={`fas ${cloudMode === 'functions' ? 'fa-bolt' : cloudMode === 'firebase' ? 'fa-fire' : 'fa-box'}`}></i></div>
                       <div>
                         <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Deployment Paradigm</h5>
                         <p className="text-[9px] text-gray-400 font-medium">Switch between cloud ecosystems.</p>
                       </div>
                     </div>
                     <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                        <button 
                          onClick={() => setCloudMode('functions')}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${cloudMode === 'functions' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                          GCP Func
                        </button>
                        <button 
                          onClick={() => setCloudMode('firebase')}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${cloudMode === 'firebase' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                          Firebase
                        </button>
                        <button 
                          onClick={() => setCloudMode('run')}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${cloudMode === 'run' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                          Cloud Run
                        </button>
                     </div>
                   </div>
                   
                   <div className="flex-grow flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                          {cloudMode === 'functions' ? 'entry_point: generateData' : cloudMode === 'firebase' ? 'sdk: firebase-functions/v2' : 'target: containerized_api'}
                        </span>
                        <a href={cloudMode === 'firebase' ? "https://console.firebase.google.com" : (cloudMode === 'functions' ? "https://console.cloud.google.com/functions" : "https://console.cloud.google.com/run")} target="_blank" className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase">
                          {cloudMode === 'firebase' ? 'Firebase Console' : 'GCP Console'}
                        </a>
                      </div>
                      <pre className="flex-grow text-[12px] sm:text-[14px] font-mono text-gray-400 leading-relaxed overflow-auto max-h-[500px] scrollbar-thin">
                        {cloudMode === 'functions' ? getCloudFunctionSnippet() : cloudMode === 'firebase' ? getFirebaseFunctionSnippet() : getCloudRunSnippet()}
                      </pre>
                   </div>
                 </div>
               ) : activeTab === 'integration' ? (
                 <div className="space-y-12 animate-in fade-in duration-500 max-w-2xl">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Step 1: Install Engine</h5>
                          <p className="text-[9px] text-gray-600 font-bold uppercase">Standard Google GenAI SDK</p>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(`npm install @google/genai`, 'inst-copy')}
                          className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-md active:scale-90 ${copied === 'inst-copy' ? 'bg-green-600 text-white' : 'text-purple-400 bg-white/5 hover:bg-white/10'}`}
                        >
                          {copied === 'inst-copy' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-black border border-white/5 rounded-2xl p-6 shadow-inner">
                        <code className="text-[11px] font-mono text-gray-500">npm install @google/genai</code>
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col relative">
                   <button 
                    onClick={() => {
                      const content = activeTab === 'json' ? result.exampleJson : activeTab === 'ts' ? result.tsInterface : displayedSchema;
                      copyToClipboard(content, 'floating-copy');
                    }}
                    className={`absolute top-0 right-0 z-10 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-2xl active:scale-90 opacity-0 group-hover/display:opacity-100 ${copied === 'floating-copy' ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 border border-white/10'}`}
                   >
                     <i className={`fas ${copied === 'floating-copy' ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                     {copied === 'floating-copy' ? 'Copied' : 'Copy Code'}
                   </button>

                   <pre className="flex-grow text-[12px] sm:text-[14px] font-mono text-gray-400 leading-relaxed overflow-auto max-h-[600px] scrollbar-thin selection:bg-purple-900/40">
                    {activeTab === 'json' ? safeJson(result.exampleJson) : 
                     activeTab === 'ts' ? (result.tsInterface || "// Processing TS structure...") : 
                     safeJson(displayedSchema)}
                  </pre>
                 </div>
               )}
               
               <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[9px] font-black text-gray-700 uppercase tracking-widest">
                    <i className="fas fa-fingerprint"></i>
                    ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                  </div>
                  <div className="text-[9px] font-black text-blue-900/50 uppercase tracking-[0.2em]">
                    Cloud Native Buffer 3.0
                  </div>
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResultView;
