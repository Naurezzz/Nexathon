import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, X, Brain, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const AIMentorChat = ({ analysisType, analysisResult, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (analysisResult && messages.length === 0) {
      explainAnalysis();
    }
  }, []);

  const explainAnalysis = async () => {
    try {
      setExplaining(true);

      const response = await fetch('http://localhost:4000/api/ai-mentor/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          analysisType,
          result: analysisResult,
          context: {}
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages([
          {
            role: 'assistant',
            content: data.explanation,
            timestamp: new Date()
          }
        ]);
      } else {
        toast.error('Failed to get explanation');
      }

    } catch (error) {
      console.error('Explanation error:', error);
      toast.error('Failed to connect to AI Mentor');
    } finally {
      setExplaining(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/ai-mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          analysisContext: analysisResult
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        }]);
      } else {
        toast.error('Failed to get response');
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const quickSuggestions = [
    'What does this mean?',
    'How can I improve?',
    'What are the key risks?',
    'Recommend next steps'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[700px] flex flex-col animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#000e00]/5 bg-gradient-to-r from-[#028355]/5 to-emerald-50 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#000e00]">AI Mentor</h2>
                <p className="text-sm text-[#000e00]/60">Get instant insights about your {analysisType} analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#e9edf4] rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-[#000e00]/60" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#e9edf4]/30 custom-scrollbar">
          
          {explaining && (
            <div className="flex justify-center animate-fadeIn">
              <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-[#028355]/20 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-[#028355]" strokeWidth={2.5} />
                <span className="text-sm font-medium text-[#000e00]">Analyzing your results...</span>
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                  <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              )}
              
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-[#028355] text-white'
                    : 'bg-white text-[#000e00] border border-[#000e00]/5'
                }`}
              >
                <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      ul: ({node, ...props}) => <ul className="ml-4 mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="leading-relaxed" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <span className={`text-xs mt-2 block ${message.role === 'user' ? 'text-white/70' : 'text-[#000e00]/40'}`}>
                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 bg-[#000e00] rounded-xl flex items-center justify-center flex-shrink-0 ml-3 shadow-sm">
                  <span className="text-white font-semibold text-sm">U</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="w-10 h-10 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm border border-[#000e00]/5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-[#000e00]/70">AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-[#000e00]/5 bg-white rounded-b-3xl">
          
          {/* Quick Suggestions */}
          <div className="mb-3 flex flex-wrap gap-2">
            {quickSuggestions.map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-[#e9edf4] hover:bg-[#028355]/10 hover:text-[#028355] text-[#000e00]/70 rounded-xl transition-all duration-150 disabled:opacity-50 font-medium flex items-center gap-1.5"
              >
                <Lightbulb className="w-3 h-3" strokeWidth={2} />
                {suggestion}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything about your analysis..."
              className="flex-1 px-5 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 focus:ring-[#028355]/20 focus:bg-white transition-all duration-200"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3.5 bg-[#028355] hover:bg-[#028355]/90 text-white rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
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

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
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
    </div>
  );
};

export default AIMentorChat;
