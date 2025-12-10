import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface Order {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
}

interface StatsChartProps {
  orders: Order[];
  type?: 'revenue' | 'orders';
}

export function StatsChart({ orders, type = 'revenue' }: StatsChartProps) {
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'dd.MM'),
        fullDate: date,
        revenue: 0,
        count: 0,
      };
    });

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const dayIndex = last7Days.findIndex(
        (day) =>
          orderDate >= startOfDay(day.fullDate) &&
          orderDate <= endOfDay(day.fullDate)
      );

      if (dayIndex !== -1) {
        last7Days[dayIndex].revenue += Number(order.total_price);
        last7Days[dayIndex].count += 1;
      }
    });

    return last7Days;
  }, [orders]);

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  };

  if (type === 'orders') {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg text-slate-900">Buyurtmalar (7 kun)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#1e293b' }}
                  formatter={(value: number) => [value + ' ta', 'Buyurtmalar']}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg text-slate-900">Daromad (7 kun)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                  tickFormatter={formatPrice}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
              />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#1e293b' }}
                formatter={(value: number) => [
                  new Intl.NumberFormat('uz-UZ').format(value) + " so'm",
                  'Daromad',
                ]}
              />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
