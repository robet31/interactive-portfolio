import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { createPostInDb } from '../lib/db';
import { generateLogEntry, LOG_TEMPLATES } from '../lib/ai-service';
import type { ChatMessage } from '../lib/ai-service';
import { toast } from 'sonner';

// ─── Generate unique ID ───
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

// ─── Format timestamp ───
function formatTime(date: Date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ─── Chat Bubble ───
function ChatBubble({ message, onSaveAsArticle }: { message: ChatMessage; onSaveAsArticle?: (html: string) => void }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isHTML = message.content.includes('<h2') || message.content.includes('<h3') || message.content.includes('<p>') || message.content.includes('<ul>') || message.content.includes('<blockquote');

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(message.content);
    } catch {
      // Fallback for environments where Clipboard API is blocked
      const textarea = document.createElement('textarea');
      textarea.value = message.content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-violet-500 to-blue-500 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] min-w-0`}>
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-muted-foreground">
            {isUser ? 'You' : 'LogBot AI'}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-md'
              : 'bg-card border border-border rounded-tl-md'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="space-y-2">
              {message.isGenerating ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating log entry...</span>
                </div>
              ) : (
                <>
                  {/* If it looks like HTML content, show a preview */}
                  {isHTML ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        Generated Log Entry
                      </div>
                      <div
                        className="article-content text-xs leading-relaxed"
                        style={{
                          fontFamily: 'var(--font-serif)',
                          lineHeight: '1.7',
                        }}
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions for AI messages */}
        {!isUser && !message.isGenerating && message.content && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? 'Copied' : 'Copy HTML'}
            </button>
            {isHTML && onSaveAsArticle && (
              <button
                onClick={() => onSaveAsArticle(message.content)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-violet-400 hover:text-violet-300 rounded-md hover:bg-violet-500/10 transition-colors"
              >
                <FileText className="w-3 h-3" />
                Save as Article
              </button>
            )}
            {message.modelUsed && (
              <span className="text-[10px] text-muted-foreground/50 ml-1">
                via {message.modelUsed}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// Main Log Generator Page
// ═══════════════════════════════════════════
export function LogGeneratorPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedHTML, setLastGeneratedHTML] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: uid(),
          role: 'assistant',
          content:
            'Halo! Saya LogBot, AI assistant untuk membuat Daily Log. 👋\n\nCeritakan kegiatan hari ini, dan saya akan menyusunnya menjadi log harian yang rapi, lengkap dengan placeholder untuk gambar dan code block template.\n\nKamu bisa langsung ketik catatanmu, atau pilih salah satu template di bawah untuk memulai!',
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating) return;

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      const assistantMsgId = uid();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isGenerating: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput('');
      setIsGenerating(true);
      setShowTemplates(false);

      try {
        // Build conversation history
        const history = [...messages, userMsg]
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content }));

        let usedModel = '';

        const result = await generateLogEntry(
          history,
          (partial) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: partial, isGenerating: true }
                  : m
              )
            );
          },
          (modelName) => {
            usedModel = modelName;
          },
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: result, isGenerating: false, modelUsed: usedModel }
              : m
          )
        );

        // Track the last generated HTML
        if (result.includes('<h2') || result.includes('<h3')) {
          setLastGeneratedHTML(result);
        }
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `⚠️ Error: ${errMsg}\n\nPastikan koneksi internet stabil. Jika masalah berlanjut, coba lagi nanti.`,
                  isGenerating: false,
                }
              : m
          )
        );
        toast.error('Failed to generate log entry');
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, messages]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Convert markdown to HTML
  const convertMarkdownToHTML = (content: string): string => {
    if (!content) return content;
    
    let html = content;
    
    // Convert headers - must be done first before other conversions
    // ## Heading -> <h2>Heading</h2>
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    // ### Heading -> <h3>Heading</h3>
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    // #### Heading -> <h4>Heading</h4>
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    
    // Convert bold/italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Convert line breaks to paragraphs (double newline)
    html = html.replace(/\n\n+/g, '</p><p>');
    
    // Wrap content that doesn't start with a tag
    if (!html.trim().startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
  };

  const handleTemplateClick = (template: (typeof LOG_TEMPLATES)[number]) => {
    sendMessage(template.prompt);
  };

  const handleSaveAsArticle = useCallback(
    async (html: string) => {
      // Convert any markdown to HTML before saving
      const convertedContent = convertMarkdownToHTML(html);
      
      const titleMatch = convertedContent.match(/<h2[^>]*>(.*?)<\/h2>/);
      const title = titleMatch
        ? titleMatch[1].replace(/<[^>]*>/g, '')
        : `Daily Log - ${new Date().toLocaleDateString('id-ID')}`;

      const newPost = await createPostInDb({
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        content: convertedContent,
        category: 'Daily Log',
        status: 'draft',
        excerpt: `Log harian: ${title}`,
        reading_time: Math.max(1, Math.ceil(convertedContent.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)),
      });

      toast.success('Log saved as draft! Redirecting to editor...');
      if (newPost) {
        navigate(`/rapi/editor/${newPost.id}`);
      }
    },
    [navigate],
  );

  const handleSendToEditor = () => {
    if (!lastGeneratedHTML) {
      toast.error('No generated content to send');
      return;
    }
    handleSaveAsArticle(lastGeneratedHTML);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        content:
          'Chat direset! Ceritakan kegiatan baru untuk dibuatkan log-nya. 📝',
        timestamp: new Date(),
      },
    ]);
    setLastGeneratedHTML('');
    setShowTemplates(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[calc(100vh-10rem)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="!text-xl sm:!text-2xl text-foreground">
              AI Log Generator
            </h1>
            <p className="text-xs text-muted-foreground">
              Ceritakan kegiatanmu, AI akan menyusun log yang rapi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastGeneratedHTML && (
            <Button
              onClick={handleSendToEditor}
              className="gap-2 rounded-xl text-sm bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Send to Editor</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearChat}
            className="rounded-xl"
            title="Clear chat"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onSaveAsArticle={handleSaveAsArticle} />
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Template chips */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-2"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-muted-foreground">Quick Templates</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LOG_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleTemplateClick(tpl)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all disabled:opacity-50"
                  >
                    <span>{tpl.emoji}</span>
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="border-t border-border p-3 bg-muted/10">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isGenerating
                    ? 'Waiting for AI response...'
                    : 'Ceritakan kegiatan hari ini... (Enter to send, Shift+Enter for new line)'
                }
                disabled={isGenerating}
                className="resize-none min-h-[44px] max-h-[160px] pr-12 rounded-xl border-border bg-background text-sm"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '44px',
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                }}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isGenerating}
              className="rounded-xl h-11 w-11 shrink-0 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
            LogBot menggunakan model AI gratis (Gemma 2, Llama 3.1, Qwen 2.5, Phi-3, Mistral, Zephyr) via OpenRouter dengan auto-fallback.
          </p>
        </div>
      </div>

      {/* Quick action: Send to Editor floating */}
      <AnimatePresence>
        {lastGeneratedHTML && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 sm:hidden"
          >
            <Button
              onClick={handleSendToEditor}
              size="lg"
              className="rounded-full shadow-xl gap-2 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
            >
              <FileText className="w-4 h-4" />
              Send to Editor
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}