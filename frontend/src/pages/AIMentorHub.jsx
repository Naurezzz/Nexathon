import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Brain, Zap, BookOpen, ChevronRight, AlertCircle, TrendingUp, Shield, FileText, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const AIMentorHub = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message on mount
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `# 👋 Welcome to AI Mentor Hub!

I'm your **intelligent financial assistant** powered by Llama 3.3 70B and a comprehensive RAG knowledge base.

### I can help you with:
• **Financial risk analysis** - Understand bankruptcy predictions & ratios
• **Invoice fraud detection** - Learn about red flags and indicators
• **Document validation** - Verify authenticity and detect tampering
• **Cybersecurity threats** - Identify phishing and malicious URLs
• **Compliance requirements** - GDPR, SOX, AML, and regulations
• **Best practices** - Expert guidance for financial safety

### How to get started:
Choose a topic below or ask me anything about your analysis results!`,
        timestamp: new Date()
      }
    ]);
  }, []);

  const quickTopics = [
    {
      id: 'financial-ratios',
      icon: <TrendingUp className="w-5 h-5" strokeWidth={2} />,
      title: 'Financial Ratios',
      color: 'from-amber-500 to-orange-600',
      description: 'Current Ratio, Debt-to-Equity, ROA, ROE explained',
      question: 'Explain key financial ratios like Current Ratio, Debt-to-Equity, ROA, and how to interpret them for bankruptcy risk'
    },
    {
      id: 'fraud-indicators',
      icon: <AlertCircle className="w-5 h-5" strokeWidth={2} />,
      title: 'Fraud Detection',
      color: 'from-red-500 to-rose-600',
      description: 'Invoice fraud patterns and detection methods',
      question: 'What are the top 10 indicators of invoice fraud and how can machine learning detect suspicious patterns?'
    },
    {
      id: 'cybersecurity',
      icon: <Shield className="w-5 h-5" strokeWidth={2} />,
      title: 'Cybersecurity',
      color: 'from-purple-500 to-pink-600',
      description: 'Phishing detection and URL safety',
      question: 'How can I identify phishing attempts and what security indicators should I check in URLs?'
    },
    {
      id: 'document-verification',
      icon: <FileText className="w-5 h-5" strokeWidth={2} />,
      title: 'Document Validation',
      color: 'from-blue-500 to-cyan-600',
      description: 'Document forensics and authenticity checks',
      question: 'What are the common signs of document tampering and how do AI systems verify document authenticity?'
    },
    {
      id: 'bankruptcy-prediction',
      icon: <DollarSign className="w-5 h-5" strokeWidth={2} />,
      title: 'Bankruptcy Risk',
      color: 'from-[#028355] to-emerald-600',
      description: 'Altman Z-score and distress indicators',
      question: 'Explain the Altman Z-score model and what financial warning signs indicate bankruptcy risk'
    },
    {
      id: 'compliance',
      icon: <BookOpen className="w-5 h-5" strokeWidth={2} />,
      title: 'Compliance',
      color: 'from-indigo-500 to-purple-600',
      description: 'GDPR, SOX, AML, FCPA regulations',
      question: 'What are the key compliance requirements for GDPR, SOX, and AML that companies must follow?'
    }
  ];

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:4000/api/ai-mentor/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          })),
          analysisContext: {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        }]);
      } else {
        toast.error(data.error || 'Failed to get response from AI Mentor');
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(`Failed to connect: ${error.message}`);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please make sure you are logged in and the backend server is running.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTopic = (topic) => {
    setSelectedTopic(topic.id);
    sendMessage(topic.question);
  };

  const suggestedQuestions = [
    'What is a good Current Ratio?',
    'How to detect duplicate invoices?',
    'Explain Altman Z-score',
    'What is phishing?',
    'GDPR compliance checklist'
  ];

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-2xl shadow-sm">
            <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#000e00]">AI Mentor Hub</h2>
            <p className="text-[#000e00]/60">Your intelligent financial assistant powered by Llama 3.3 70B</p>
          </div>
        </div>

        {/* Info Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="px-3 py-1.5 bg-[#028355]/10 border border-[#028355]/20 rounded-full flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#028355]" strokeWidth={2} />
            <span className="text-xs font-medium text-[#028355]">Powered by Llama 3.3 70B</span>
          </div>
          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" strokeWidth={2} />
            <span className="text-xs font-medium text-blue-600">RAG Knowledge Base</span>
          </div>
          <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" strokeWidth={2} />
            <span className="text-xs font-medium text-purple-600">50+ Expert Topics</span>
          </div>
        </div>
      </div>

      {/* Quick Topics - Show only if chat is empty */}
      {messages.length <= 1 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#000e00] mb-4">Quick Start Topics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickTopics.map(topic => (
              <button
                key={topic.id}
                onClick={() => handleQuickTopic(topic)}
                disabled={loading}
                className="group p-5 bg-white hover:bg-[#e9edf4] rounded-2xl border border-[#000e00]/5 hover:border-[#028355]/20 transition-all duration-200 text-left shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${topic.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <div className="text-white">
                    {topic.icon}
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-[#000e00] mb-1.5">{topic.title}</h4>
                <p className="text-xs text-[#000e00]/60 leading-relaxed">{topic.description}</p>
                <div className="flex items-center gap-1 mt-3 text-[#028355] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium">Ask now</span>
                  <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#000e00]/5 overflow-hidden">
        
        {/* Messages Area */}
        <div className="h-[600px] overflow-y-auto p-6 space-y-6 bg-[#e9edf4]/30 custom-scrollbar">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  message.role === 'user'
                    ? 'bg-[#028355] text-white shadow-sm'
                    : 'bg-white text-[#000e00] shadow-sm border border-[#000e00]/5'
                }`}
              >
                <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-2 mt-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="mb-3 ml-4 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="mb-3 ml-4 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline 
                          ? <code className="px-1.5 py-0.5 bg-[#000e00]/10 rounded text-sm font-mono" {...props} />
                          : <code className="block p-3 bg-[#000e00]/10 rounded-lg text-sm font-mono overflow-x-auto" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div className={`text-xs mt-3 ${message.role === 'user' ? 'text-white/70' : 'text-[#000e00]/40'}`}>
                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 bg-[#000e00] rounded-xl flex items-center justify-center flex-shrink-0 ml-3 shadow-sm">
                  <span className="text-white font-semibold">U</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="w-10 h-10 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm border border-[#000e00]/5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-[#000e00]/70">AI Mentor is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 bg-white border-t border-[#000e00]/5">
          
          {/* Suggested Questions */}
          {messages.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestedQuestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs bg-[#e9edf4] hover:bg-[#028355]/10 hover:text-[#028355] text-[#000e00]/70 rounded-xl transition-all duration-150 disabled:opacity-50 font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything about financial analysis, fraud detection, compliance..."
              className="flex-1 px-5 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 focus:ring-[#028355]/20 focus:bg-white transition-all duration-200"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-6 py-3.5 bg-[#028355] hover:bg-[#028355]/90 text-white rounded-2xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
              ) : (
                <>
                  <Send className="w-5 h-5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 bg-white rounded-2xl border border-[#000e00]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#028355]/10 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#028355]" strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-[#000e00]">Smart Explanations</h3>
          </div>
          <p className="text-sm text-[#000e00]/60 leading-relaxed">
            Get plain-English explanations of complex financial concepts and analysis results in seconds.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#000e00]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-[#000e00]">Knowledge Base</h3>
          </div>
          <p className="text-sm text-[#000e00]/60 leading-relaxed">
            Access 50+ expert topics covering finance, fraud detection, security, and compliance.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#000e00]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-[#000e00]">Instant Answers</h3>
          </div>
          <p className="text-sm text-[#000e00]/60 leading-relaxed">
            Powered by Llama 3.3 70B for fast, accurate, and contextual responses.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e9edf4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #028355;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #026b44;
        }
      `}</style>
    </>
  );
};

export default AIMentorHub;
