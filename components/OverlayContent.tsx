
import React from 'react';
import { marked } from 'marked';

interface OverlayContentProps {
  type: 'docs' | 'api' | 'privacy' | 'terms' | 'deploy';
  onClose: () => void;
}

const OverlayContent: React.FC<OverlayContentProps> = ({ type, onClose }) => {
  const getContent = () => {
    switch (type) {
      case 'deploy':
        return `
# Deployment Blueprints

Scale your synthesis engine across Google's elite cloud infrastructure.

### 1. Firebase Ecosystem
The preferred choice for web-centric developers and mobile application ecosystems.
- **Firebase Hosting**: High-speed global CDN for the front-end workbench.
- **Firebase Functions**: Seamless serverless integration for your synthesis nodes.
- **Console**: [console.firebase.google.com](https://console.firebase.google.com)

**Hosting Command:**
\`\`\`bash
# Initialize project
firebase init hosting

# Build and Deploy
npm run build && firebase deploy --only hosting
\`\`\`

**Functions Command:**
\`\`\`bash
# Deploy synthesis function
firebase deploy --only functions:generateData
\`\`\`

---

### 2. Google Cloud Run (Containers)
The modern serverless choice for high-scale containerized applications.
- **Console Link**: [Google Cloud Run](https://console.cloud.google.com/run)
- **Automatic Scaling**: 0 to 1000+ instances.

**Deployment CLI:**
\`\`\`bash
# Build and Push
gcloud builds submit --tag gcr.io/[PROJECT_ID]/synthesis-engine

# Deploy
gcloud run deploy synthesis-engine \\
  --image gcr.io/[PROJECT_ID]/synthesis-engine \\
  --allow-unauthenticated \\
  --set-env-vars GEMINI_API_KEY=[YOUR_KEY]
\`\`\`

---

### 3. Google Cloud Functions (Gen 2)
Lightweight, event-driven FaaS directly on GCP.
- **Console Link**: [Cloud Functions](https://console.cloud.google.com/functions)

**Deployment CLI:**
\`\`\`bash
gcloud functions deploy generateData \\
  --gen2 \\
  --runtime=nodejs20 \\
  --trigger-http \\
  --set-secrets 'GEMINI_API_KEY=GEMINI_API_KEY:latest'
\`\`\`

> **Security Note**: Always use **Secret Manager** for API keys. Never commit your Gemini API keys to version control.
        `;
      case 'docs':
        return `
# Discovery Documentation

The **JSON Prompt Discovery Engine** is a specialized workbench for finding, auditing, and optimizing data structures for AI applications.

### 1. Smart Discovery
Our system utilizes **Google Search Grounding** to bypass typical AI hallucinations. It searches live technical documentation and public APIs to ensure the structures we provide are based on real-world implementations.

### 2. Prompt Synthesis
Once a structure is identified, we use a secondary AI pass to "Reverse Engineer" the prompt. This creates a high-fidelity instruction set that you can drop into any LLM (Gemini, GPT-4, etc.) to generate consistent mock or synthetic data.

### 3. Structural Auditing
The **Audit Structure** tool runs a series of sanity checks:
- **CamelCase Consistency**: Checks if keys follow standard JS/TS naming.
- **Data Sanity**: Ensures dates, numbers, and strings are logically assigned.
- **Type Compliance**: Cross-references nested structures for circularity or depth issues.
        `;
      case 'api':
        return `
# API Access Guide

This application is powered by the **Google Gemini API**. To understand how to manage your own keys or use our infrastructure:

### Authentication
The application expects a valid API Key provided through the \`process.env.API_KEY\` environment variable. 

### Model Selection
- **Discovery Pass**: Uses \`gemini-3-flash-preview\` for high-speed search analysis.
- **Synthesis Pass**: Uses \`gemini-3-flash-preview\` with structured output configuration.

### Rate Limits
Users are subject to the standard quotas defined in the [Google AI Studio Pricing](https://ai.google.dev/pricing). 
        `;
      case 'privacy':
        return `
# Privacy Policy

We take developer privacy seriously. Our architecture is designed to minimize data footprint.

### Browser-Level Storage
**All "Saved Prompts"** stay on your device. We use browser \`localStorage\` to keep your curated list available. We do not maintain a backend database of your personal bookmarks.

### AI Processing
Search queries are transmitted directly to Google's Gemini models. Please review [Google's Privacy Policy](https://policies.google.com/privacy) for details on how they process AI-grounded search data.
        `;
      case 'terms':
        return `
# Terms of Service

### Usage Agreement
By using the JSON Prompt Discovery Engine, you acknowledge that the content is AI-generated and grounded in search results. It is provided "as is" for development purposes.

### Intellectual Property
The prompts and schemas generated are yours to use in your own applications. No attribution is required, though appreciated.
        `;
      default:
        return '';
    }
  };

  const renderContent = () => {
    return { __html: marked.parse(getContent(), { breaks: true }) };
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl bg-[#141414] border border-gray-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-800 bg-[#161616]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${type === 'deploy' ? 'bg-orange-600/10 text-orange-400' : 'bg-blue-600/10 text-blue-400'}`}>
              <i className={`fas ${
                type === 'docs' ? 'fa-book-open' : 
                type === 'api' ? 'fa-terminal' : 
                type === 'privacy' ? 'fa-user-shield' : 
                type === 'deploy' ? 'fa-fire-alt' :
                'fa-balance-scale'
              }`}></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white capitalize leading-none mb-1">
                {type === 'deploy' ? 'Cloud Deployment' : type}
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">Infrastucture Config</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl hover:bg-gray-800 flex items-center justify-center transition-all text-gray-400 hover:text-white hover:rotate-90 active:scale-90"
            aria-label="Close"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 md:p-16 scrollbar-thin scrollbar-thumb-gray-800">
          <div 
            className="markdown-content max-w-4xl mx-auto"
            dangerouslySetInnerHTML={renderContent()}
          />
        </div>
        
        {/* Modal Footer */}
        <div className="p-8 border-t border-gray-800 bg-[#111] flex items-center justify-between">
          <div className="text-xs text-gray-600 flex items-center gap-2">
            <i className="fas fa-info-circle"></i>
            CLI Tools: npm install -g firebase-tools
          </div>
          <div className="flex gap-4">
             <a 
              href="https://console.firebase.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 font-black rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-all flex items-center gap-2"
            >
              <i className="fas fa-external-link-alt text-orange-400"></i>
              Firebase
            </a>
            <button 
              onClick={onClose}
              className={`px-10 py-3 font-black rounded-2xl transition-all active:scale-95 shadow-xl ${
                type === 'deploy' 
                ? 'bg-orange-600 text-white hover:bg-orange-500' 
                : 'bg-white text-black hover:bg-blue-400 hover:text-white shadow-white/5'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayContent;
