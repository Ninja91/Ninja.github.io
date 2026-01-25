import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Key, Database, Save, CheckCircle } from 'lucide-react';

export function Settings() {
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
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <Card className="max-w-xl mx-auto border lg:border-slate-200 lg:shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
                <p className="text-xs text-slate-500">Keys are stored locally in your session.</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold flex items-center gap-2"><Key size={14} /> TensorLake API Key</label>
                    <input
                        type="password"
                        value={tlKey}
                        onChange={(e) => setTlKey(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="tl_apiKey_..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold flex items-center gap-2"><Key size={14} /> Gemini API Key</label>
                    <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="AIzaSy..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold flex items-center gap-2"><Database size={14} /> Neon Database URL</label>
                    <input
                        type="password"
                        value={dbUrl}
                        onChange={(e) => setDbUrl(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="postgresql://..."
                    />
                </div>

                <Button onClick={handleSave} className="w-full mt-4 gap-2" variant={saved ? "success" : "default"}>
                    {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save All Settings</>}
                </Button>
            </CardContent>
        </Card>
    );
}
