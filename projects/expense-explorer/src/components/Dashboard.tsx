import { Card, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Calendar, CreditCard, PieChart, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
    insights: any;
}

export function Dashboard({ insights }: DashboardProps) {
    if (!insights) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center animate-pulse">
                <PieChart size={64} strokeWidth={1} className="mb-6 opacity-20" />
                <h3 className="text-lg font-bold text-slate-900">Intelligence Waiting</h3>
                <p className="text-sm max-w-[200px]">Upload a statement to begin your analysis.</p>
            </div>
        );
    }

    const categoryData = Object.entries(insights.category_summary || {}).map(([name, value]) => ({
        name,
        value: Number(value)
    }));

    const trendData = (insights.trends?.monthly || []).map((item: any) => ({
        month: item.month,
        amount: Number(item.amount)
    }));

    const COLORS = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#ff2d55'];

    return (
        <div className="space-y-10 pb-20">
            {/* Top Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="apple-card p-6 h-[260px] flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 font-bold uppercase text-[10px]">Monthly Trend</Badge>
                    </div>
                    <CardTitle className="text-[17px] mb-6">Spending Momentum</CardTitle>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <XAxis dataKey="month" hide />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: '0.5px solid rgba(0,0,0,0.1)',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                        padding: '8px 12px'
                                    }}
                                />
                                <Bar dataKey="amount" fill="#007aff" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="apple-card p-6 h-[260px] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                            <AlertCircle size={20} />
                        </div>
                        <Badge variant="secondary" className="bg-red-50 text-red-600 border-0 font-bold uppercase text-[10px]">Active Anomalies</Badge>
                    </div>
                    <CardTitle className="text-[17px] mb-4">Risk Detection</CardTitle>
                    <div className="space-y-3 overflow-y-auto pr-1">
                        {(insights.anomalies || []).map((a: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-[13px] font-bold text-slate-900 leading-tight">{a.description}</div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                        <Calendar size={10} /> {a.date} • ${a.amount}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!insights.anomalies || insights.anomalies.length === 0) && (
                            <div className="h-full flex flex-col items-center justify-center pt-8 opacity-40">
                                <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                                <p className="text-xs font-medium">No risks found</p>
                            </div>
                        )}
                    </div>
                </Card>
            </section>

            {/* Categories */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Category Intelligence</h4>
                </div>
                <Card className="apple-card p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 p-2">
                        {categoryData.sort((a, b) => b.value - a.value).map((cat, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                                    <span className="text-[15px] font-bold text-black">${cat.value.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: `${(cat.value / (Math.max(...categoryData.map(c => c.value)) || 1)) * 100}%`,
                                            backgroundColor: COLORS[idx % COLORS.length]
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </section>

            {/* Subscriptions */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Recurring Obligations</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(insights.subscriptions || []).map((s: any, idx: number) => (
                        <Card key={idx} className="apple-card p-4 flex justify-between items-center group hover:scale-[1.02] transition-transform cursor-default">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <div className="text-[13px] font-bold text-slate-900">{s.description}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{s.provider}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-black">${s.amount}</div>
                                <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">Monthly</div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
