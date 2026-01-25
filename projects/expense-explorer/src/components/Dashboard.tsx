import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Calendar, CreditCard } from 'lucide-react';

interface DashboardProps {
    insights: any;
}

export function Dashboard({ insights }: DashboardProps) {
    if (!insights) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
                <TrendingUp size={48} className="mb-4 opacity-20" />
                <p>No data loaded yet. Connect your keys or load sample data.</p>
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

    const COLORS = ['#3f83f8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500" /> Spending Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <XAxis dataKey="month" hide />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-500" /> Recent Anomalies
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(insights.anomalies || []).map((a: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-2 bg-red-50 rounded-lg border border-red-100">
                                <AlertCircle size={14} className="text-red-600 mt-1 shrink-0" />
                                <div>
                                    <div className="text-xs font-semibold text-red-900">{a.description}</div>
                                    <div className="text-[10px] text-red-600 flex items-center gap-1">
                                        <Calendar size={10} /> {a.date} • ${a.amount}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!insights.anomalies || insights.anomalies.length === 0) && (
                            <p className="text-xs text-slate-500 italic p-2">No anomalies detected.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {categoryData.sort((a, b) => b.value - a.value).map((cat, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <Badge variant="outline">{cat.name}</Badge>
                                    <span className="font-semibold">${cat.value.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(cat.value / (Math.max(...categoryData.map(c => c.value)) || 1)) * 100}%`,
                                            backgroundColor: COLORS[idx % COLORS.length]
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CreditCard size={16} className="text-emerald-500" /> Subscriptions
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(insights.subscriptions || []).map((s: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-3 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <div className="text-[11px] font-bold text-slate-900">{s.description}</div>
                                <div className="text-[10px] text-slate-500">{s.provider}</div>
                            </div>
                            <Badge variant="success">${s.amount}/mo</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
