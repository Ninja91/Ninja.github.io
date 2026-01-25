import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Key, Database, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsProps {
    onSave?: () => void;
}

export function Settings({ onSave }: SettingsProps) {
    const [tlKey, setTlKey] = useState(sessionStorage.getItem('TENSORLAKE_API_KEY') || '');
    const [geminiKey, setGeminiKey] = useState(sessionStorage.getItem('GEMINI_API_KEY') || '');
    const [dbUrl, setDbUrl] = useState(sessionStorage.getItem('DATABASE_URL') || '');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        const clean = (val: string) => {
            let v = val.trim();
            if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
                v = v.substring(1, v.length - 1);
            }
            return v;
        };

        if (tlKey) sessionStorage.setItem('TENSORLAKE_API_KEY', clean(tlKey));
        else sessionStorage.removeItem('TENSORLAKE_API_KEY');

        if (geminiKey) sessionStorage.setItem('GEMINI_API_KEY', clean(geminiKey));
        else sessionStorage.removeItem('GEMINI_API_KEY');

        if (dbUrl) sessionStorage.setItem('DATABASE_URL', clean(dbUrl));
        else sessionStorage.removeItem('DATABASE_URL');

        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onSave?.();
        }, 1000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 fade-up">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-black tracking-tight">Security \u0026 Connections</h3>
                <p className="text-sm text-slate-500">Your keys remain in your browser's private session storage.</p>
            </div>

            <div className="grid gap-6">
                <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Key size={12} />
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Storage \u0026 OCR</h4>
                    </div>
                    <Card className="apple-card overflow-hidden">
                        <div className="p-0 divide-y divide-slate-100">
                            <div className="flex items-center px-4 py-3 gap-4">
                                <span className="text-sm font-medium w-32 shrink-0">TensorLake</span>
                                <input
                                    type="password"
                                    value={tlKey}
                                    onChange={(e) => setTlKey(e.target.value)}
                                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-300"
                                    placeholder="tl_apiKey_..."
                                />
                            </div>
                            <div className="flex items-center px-4 py-3 gap-4">
                                <span className="text-sm font-medium w-32 shrink-0">Gemini Pro</span>
                                <input
                                    type="password"
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-300"
                                    placeholder="AIzaSy..."
                                />
                            </div>
                        </div>
                    </Card>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Database size={12} />
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Database</h4>
                    </div>
                    <Card className="apple-card p-0">
                        <div className="flex items-center px-4 py-3 gap-4">
                            <span className="text-sm font-medium w-32 shrink-0">Neon URL</span>
                            <input
                                type="password"
                                value={dbUrl}
                                onChange={(e) => setDbUrl(e.target.value)}
                                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-300"
                                placeholder="postgresql://..."
                            />
                        </div>
                    </Card>
                </section>
            </div>

            <Button
                onClick={handleSave}
                disabled={saved}
                className={cn(
                    "w-full rounded-2xl h-12 text-[15px] font-bold shadow-xl transition-all active:scale-[0.98]",
                    saved ? "bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700"
                )}
            >
                {saved ? (
                    <><CheckCircle2 size={18} className="mr-2" /> Settings Applied</>
                ) : (
                    <><span className="flex-1">Connect Pipeline</span> <ChevronRight size={18} /></>
                )}
            </Button>

            <p className="text-[11px] text-center text-slate-400 px-8">
                By connecting, your browser will securely proxy requests to the TensorLake API.
                Your credentials are never stored on our server.
            </p>
        </div>
    );
}
