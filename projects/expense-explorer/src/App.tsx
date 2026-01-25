import { useState, useEffect } from 'react';
import { TabsContent } from './components/ui/Tabs';
import { Dashboard } from './components/Dashboard';
import { Chat } from './components/Chat';
import { Settings } from './components/Settings';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { runRemoteApp, pollRequest } from './api/client';
import { LayoutDashboard, MessageSquare, Settings as SettingsIcon, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { Badge } from './components/ui/Badge';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [messages, setMessages] = useState<{ role: 'agent' | 'user', text: string }[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);

    // Initial load check
    const hasKeys = sessionStorage.getItem('TENSORLAKE_API_KEY');
    if (hasKeys) {
      refreshInsights(false);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshInsights = async (force = true) => {
    setIsLoading(true);
    try {
      const { request_id } = await runRemoteApp('insights_app', { force_refresh: force });
      const data = await pollRequest(request_id);
      setInsights(data);
    } catch (error) {
      console.error(error);
      if (messages.length === 0) {
        setMessages([{ role: 'agent', text: "Welcome! To get started, please add your API keys in Settings or click 'Load Demo Data' below." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemo = () => {
    const sampleInsights = {
      category_summary: { "Food": 450.20, "Rent": 1200.00, "Subscriptions": 89.90, "Travel": 320.15 },
      subscriptions: [
        { description: "Netflix", amount: 15.99, provider: "Visa", occurrences: 12 },
        { description: "SaaS Tool", amount: 29.00, provider: "Amex", occurrences: 6 }
      ],
      anomalies: [
        { description: "High Spending in Food", amount: 150.00, date: "2025-01-20", merchant: "Fancy Restaurant", severity: "medium" }
      ],
      trends: {
        monthly: [
          { month: "2024-10", amount: 2100 },
          { month: "2024-11", amount: 1950 },
          { month: "2024-12", amount: 2400 },
          { month: "2025-01", amount: 1800 }
        ]
      }
    };
    setInsights(sampleInsights);
    setMessages(prev => [...prev, { role: 'agent', text: "Demo mode activated. I've loaded some sample financial data for you to explore." }]);
    setActiveTab('dashboard');
  };

  const handleSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);
    try {
      const { request_id } = await runRemoteApp('query_app', { user_query: text });
      const answer = await pollRequest(request_id);
      setMessages(prev => [...prev, { role: 'agent', text: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'agent', text: "I'm having trouble connecting to the brain. Please check your Gemini API key in Settings." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Expense Explorer
          </h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest hidden sm:block">Cloud-Native Financial Intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          {!insights && (
            <Button variant="outline" size="sm" onClick={loadDemo} className="rounded-full h-8 text-xs px-4 border-blue-200 text-blue-600 hover:bg-blue-50">
              Load Demo
            </Button>
          )}
          <Button size="icon" variant="ghost" className="rounded-full text-slate-500 hover:text-slate-900" onClick={() => refreshInsights(true)} disabled={isLoading}>
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </Button>
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-full px-3">
            <Badge variant="secondary" className="bg-white shadow-sm border-0 text-[10px]">
              {isMobile ? <Smartphone size={10} className="mr-1" /> : <Monitor size={10} className="mr-1" />}
              {isMobile ? "Mobile View" : "Desktop View"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {isMobile ? (
          /* Mobile View: Tabbed Layout */
          <div className="h-full">
            <TabsContent value="dashboard" activeValue={activeTab} className="h-full overflow-y-auto p-4 m-0">
              <Dashboard insights={insights} />
            </TabsContent>
            <TabsContent value="chat" activeValue={activeTab} className="h-full m-0 p-0 flex flex-col">
              <Chat messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="settings" activeValue={activeTab} className="h-full overflow-y-auto p-4 m-0">
              <Settings />
            </TabsContent>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-2 flex justify-around items-center z-50 shadow-2xl">
              <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
                <LayoutDashboard size={20} />
                <span className="text-[10px] font-bold">Dashboard</span>
              </button>
              <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-blue-600' : 'text-slate-400'}`}>
                <MessageSquare size={20} />
                <span className="text-[10px] font-bold">Chat</span>
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
                <SettingsIcon size={20} />
                <span className="text-[10px] font-bold">Settings</span>
              </button>
            </div>
          </div>
        ) : (
          /* Desktop View: Split Layout */
          <div className="h-full flex p-6 gap-6">
            <div className="w-1/3 flex flex-col gap-6">
              <Card className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-lg">
                <h2 className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Financial Brain</h2>
                <p className="text-xl font-semibold mb-4 leading-snug">Ask your expenses anything using natural language.</p>
                <div className="flex gap-2">
                  <Badge className="bg-white/20 border-0 text-white backdrop-blur-sm">Gemini 2.5</Badge>
                  <Badge className="bg-white/20 border-0 text-white backdrop-blur-sm">TensorLake</Badge>
                </div>
              </Card>
              <div className="flex-1 overflow-hidden">
                <Chat messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <LayoutDashboard size={20} className="text-blue-500" /> Intelligence Dashboard
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab(activeTab === 'settings' ? 'dashboard' : 'settings')}>
                  {activeTab === 'settings' ? <LayoutDashboard size={16} className="mr-2" /> : <SettingsIcon size={16} className="mr-2" />}
                  {activeTab === 'settings' ? 'Back to Dashboard' : 'Settings'}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                {activeTab === 'settings' ? <Settings /> : <Dashboard insights={insights} />}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
