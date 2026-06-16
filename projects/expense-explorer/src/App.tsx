import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TabsContent } from './components/ui/Tabs';
import { Dashboard } from './components/Dashboard';
import { Chat } from './components/Chat';
import { Settings } from './components/Settings';
import { Button } from './components/ui/Button';
import { FileUpload } from './components/FileUpload';
import { runRemoteApp, pollRequest } from './api/client';
import { LayoutDashboard, MessageSquare, Settings as SettingsIcon, RefreshCw, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';
import { Badge } from './components/ui/Badge';
import { cn } from './lib/utils';

type AppTab = 'dashboard' | 'chat' | 'settings';

interface Message {
  id: string;
  role: 'agent' | 'user';
  text: string;
}

interface DemoInsights {
  category_summary: Record<string, number>;
  subscriptions: Array<{ description: string; amount: number; provider: string; occurrences: number }>;
  anomalies: Array<{ description: string; amount: number; date: string; merchant: string; severity: string }>;
  trends: { monthly: Array<{ month: string; amount: number }> };
}

interface MobileTabConfig {
  id: AppTab;
  icon: LucideIcon;
  label: string;
}

const WELCOME_MESSAGE = "Hello! Welcome to Expense Explorer. Start by connecting your keys in Settings or load demo data to see how I analyze your finances.";
const MOBILE_TABS: MobileTabConfig[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Insights' },
  { id: 'chat', icon: MessageSquare, label: 'Assistant' },
  { id: 'settings', icon: SettingsIcon, label: 'Setup' }
];

const DEMO_INSIGHTS: DemoInsights = {
  category_summary: { "Food \u0026 Dining": 450.20, "Fixed Rent": 1200.00, "Online Subs": 89.90, "Travel \u0026 Work": 320.15 },
  subscriptions: [
    { description: "Netflix Premium", amount: 15.99, provider: "Apple Card", occurrences: 12 },
    { description: "Adobe CC", amount: 52.99, provider: "Amex Platinum", occurrences: 6 }
  ],
  anomalies: [
    { description: "Suspected Duplicate Charge", amount: 150.00, date: "2025-01-20", merchant: "Fancy Bistro", severity: "high" }
  ],
  trends: {
    monthly: [
      { month: "Oct", amount: 2100 },
      { month: "Nov", amount: 1950 },
      { month: "Dec", amount: 2400 },
      { month: "Jan", amount: 1800 }
    ]
  }
};

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [insights, setInsights] = useState<DemoInsights | Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [hasKeys, setHasKeys] = useState(!!sessionStorage.getItem('TENSORLAKE_API_KEY'));
  const messageCounterRef = useRef(0);

  const createMessage = useCallback((role: Message['role'], text: string): Message => ({
    id: `msg-${++messageCounterRef.current}`,
    role,
    text
  }), []);

  const appendMessage = useCallback((role: Message['role'], text: string) => {
    setMessages((prev) => [...prev, createMessage(role, text)]);
  }, [createMessage]);

  const refreshInsights = useCallback(async (force = true, options: { trackLoading?: boolean } = {}) => {
    const shouldTrackLoading = options.trackLoading ?? true;
    if (shouldTrackLoading) setIsLoading(true);
    try {
      const { request_id } = await runRemoteApp('insights_app', { force_refresh: force });
      const data = await pollRequest(request_id, 'insights_app');
      setInsights(data as DemoInsights | Record<string, unknown>);
    } catch (error) {
      console.error(error);
    } finally {
      if (shouldTrackLoading) setIsLoading(false);
    }
  }, []);

  const checkProxy = useCallback(async () => {
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalHost) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 1_500);
    try {
      const resp = await fetch('http://localhost:8888/', { signal: controller.signal });
      if (!resp.ok || sessionStorage.getItem('TENSORLAKE_API_KEY')) return;

      const configResp = await fetch('http://localhost:8888/api/config', { signal: controller.signal });
      if (!configResp.ok) return;
      const config = await configResp.json() as Record<string, string>;

      if (config.TENSORLAKE_API_KEY) sessionStorage.setItem('TENSORLAKE_API_KEY', config.TENSORLAKE_API_KEY);
      if (config.GEMINI_API_KEY) sessionStorage.setItem('GEMINI_API_KEY', config.GEMINI_API_KEY);
      if (config.DATABASE_URL) sessionStorage.setItem('DATABASE_URL', config.DATABASE_URL);

      if (config.TENSORLAKE_API_KEY) {
        setHasKeys(true);
      }
    } catch (_error) {
      // Ignore proxy detection errors; hosted mode still works.
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [refreshInsights]);

  useEffect(() => {
    let animationFrameId: number | null = null;
    const handleResize = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = window.requestAnimationFrame(() => {
        setIsMobile(window.innerWidth < 1024);
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    void checkProxy();
    if (hasKeys) {
      void refreshInsights(false);
      return;
    }
    setMessages([createMessage('agent', WELCOME_MESSAGE)]);
  }, [checkProxy, createMessage, hasKeys, refreshInsights]);

  const handleFileUpload = useCallback(async (filename: string, base64: string, contentType: string) => {
    setIsLoading(true);
    appendMessage('user', `Uploaded statement: ${filename}. Processing...`);
    try {
      const { request_id } = await runRemoteApp('expense_ingestion_app', {
        file_b64: base64,
        content_type: contentType,
        filename
      });
      await pollRequest(request_id, 'expense_ingestion_app');
      appendMessage('agent', `Successfully ingested ${filename}! Refreshing insights...`);
      await refreshInsights(true, { trackLoading: false });
    } catch (error) {
      appendMessage('agent', `Ingestion failed: ${error instanceof Error ? error.message : "Internal Error"}. Check Settings.`);
    } finally {
      setIsLoading(false);
    }
  }, [appendMessage, refreshInsights]);

  const loadDemo = useCallback(() => {
    setInsights(DEMO_INSIGHTS);
    appendMessage('agent', "Demo Mode is active. I've populated the dashboard with sample financial intelligence.");
    setActiveTab('dashboard');
  }, [appendMessage]);

  const handleSendMessage = useCallback(async (text: string) => {
    appendMessage('user', text);
    setIsLoading(true);
    try {
      const { request_id } = await runRemoteApp('query_app', { user_query: text });
      const answer = await pollRequest(request_id, 'query_app');
      appendMessage('agent', String(answer));
    } catch (_error) {
      appendMessage('agent', "I'm having trouble connecting. Please verify your keys in Settings.");
    } finally {
      setIsLoading(false);
    }
  }, [appendMessage]);

  const handleSaveSettings = useCallback(() => {
    setHasKeys(true);
    setActiveTab('dashboard');
    void refreshInsights(false);
  }, [refreshInsights]);

  const navTabs = useMemo(() => MOBILE_TABS, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col antialiased selection:bg-blue-100/50">
      {/* Universal Header (Glass) */}
      <header className="glass apple-border sticky top-0 z-50 px-6 py-4 flex justify-between items-center h-[72px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg">
            <Sparkles size={18} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-black leading-tight">Expense Explorer</h1>
            <div className="flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-500" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Secure Cloud AI</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!insights && (
            <Button variant="outline" size="sm" onClick={loadDemo} className="rounded-full h-8 text-xs font-semibold px-4 apple-border bg-white text-black hover:bg-slate-50 transition-all active:scale-95">
              Try Demo
            </Button>
          )}
          <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-slate-400 hover:text-black hover:bg-black/5" onClick={() => void refreshInsights(true)} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative max-w-[1600px] mx-auto w-full">
        {isMobile ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pb-[100px] px-4 pt-6 space-y-6">
              <TabsContent value="dashboard" activeValue={activeTab} className="m-0 fade-up">
                <div className="mb-6">
                  <FileUpload onUpload={handleFileUpload} isLoading={isLoading} />
                </div>
                <Dashboard insights={insights} />
              </TabsContent>
              <TabsContent value="chat" activeValue={activeTab} className="m-0 h-[calc(100vh-172px)] flex flex-col fade-up">
                <Chat messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
              </TabsContent>
              <TabsContent value="settings" activeValue={activeTab} className="m-0 fade-up">
                <Settings onSave={handleSaveSettings} />
              </TabsContent>
            </div>

            {/* Apple Style Bottom Nav */}
            <nav className="glass apple-border fixed bottom-6 left-6 right-6 h-16 rounded-[24px] shadow-2xl flex justify-around items-center px-4 z-50">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all duration-300 active:scale-90",
                    activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'
                  )}
                >
                  <tab.icon size={20} className={cn("transition-all", activeTab === tab.id && "scale-110")} />
                  <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        ) : (
          /* Desktop App Layout */
          <div className="h-[calc(100vh-72px)] flex p-8 gap-8">
            <div className="w-[400px] flex flex-col gap-6 fade-up">
              <div className="h-full flex flex-col apple-card overflow-hidden">
                <Chat messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 fade-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-black tracking-tight tracking-tight">
                    {activeTab === 'settings' ? 'Cloud Configuration' : 'Financial Dashboard'}
                  </h2>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 px-2 py-0.5 font-bold">
                    {activeTab === 'settings' ? 'Encrypted' : 'Real-time Intelligence'}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="rounded-full h-9 px-4 apple-border bg-white" onClick={() => setActiveTab(activeTab === 'settings' ? 'dashboard' : 'settings')}>
                  {activeTab === 'settings' ? <LayoutDashboard size={14} className="mr-2" /> : <SettingsIcon size={14} className="mr-2" />}
                  {activeTab === 'settings' ? 'Dashboard' : 'Configure Pipeline'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {activeTab === 'settings' ? (
                  <Settings onSave={handleSaveSettings} />
                ) : (
                  <div className="space-y-8 pb-12">
                    <FileUpload onUpload={handleFileUpload} isLoading={isLoading} />
                    <Dashboard insights={insights} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
