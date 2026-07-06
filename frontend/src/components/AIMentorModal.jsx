import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, X, Brain, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const AIMentorModal = ({ analysisType, analysisResult, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello! I'm your AI Mentor. I've analyzed your **${analysisType}** results. Ask me anything about the findings!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const response = await fetch('http://localhost:4000/api/ai-mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          })),
          analysisContext: {
            type: analysisType,
            result: analysisResult
          }
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
      toast.error('Failed to connect to AI Mentor');
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Explain these results simply',
    'What should I do next?',
    'What are the key risks?',
    'How can I improve?'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#000e00]/5 bg-gradient-to-r from-[#028355]/5 to-emerald-50 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#000e00]">AI Mentor</h2>
                <p className="text-sm text-[#000e00]/60">Ask about your {analysisType} results</p>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#e9edf4]/30 custom-scrollbar">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              {message.role === 'assistant' && (
                <div className="w-9 h-9 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                  <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-[#028355] text-white'
                    : 'bg-white text-[#000e00] border border-[#000e00]/5'
                }`}
              >
                <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <span className={`text-xs mt-2 block ${message.role === 'user' ? 'text-white/70' : 'text-[#000e00]/40'}`}>
                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {message.role === 'user' && (
                <div className="w-9 h-9 bg-[#000e00] rounded-xl flex items-center justify-center flex-shrink-0 ml-3 shadow-sm">
                  <span className="text-white font-semibold text-sm">U</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="w-9 h-9 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm border border-[#000e00]/5">
                <Loader2 className="w-4 h-4 animate-spin text-[#028355]" strokeWidth={2.5} />
                <span className="text-sm text-[#000e00]/70">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-6 py-3 border-t border-[#000e00]/5 bg-white">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-[#e9edf4] hover:bg-[#028355]/10 hover:text-[#028355] rounded-xl text-[#000e00]/70 transition-all disabled:opacity-50 font-medium flex items-center gap-1.5"
              >
                <Lightbulb className="w-3 h-3" strokeWidth={2} />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-5 border-t border-[#000e00]/5 bg-white rounded-b-3xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 focus:ring-[#028355]/20 focus:bg-white transition-all"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-[#028355] hover:bg-[#028355]/90 text-white rounded-2xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

      </div>

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
      `}</style>
    </div>
  );
};

export default AIMentorModal;
