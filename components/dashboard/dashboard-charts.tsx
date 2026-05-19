"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type DashboardChartsProps = {
  context: "user" | "admin" | "marketplace";
  adminChartsData?: {
    attemptsByDay: Array<{ day: string; total: number; confirmed: number; failed: number }>;
    revenueByDay: Array<{ day: string; revenueLamports: number }>;
  };
};

type TrendPoint = {
  name: string;
  value: number;
};

type KpiStat = {
  label: string;
  value: string;
  trendLabel: string;
  trend: TrendPoint[];
};

type DashboardData = {
  kpis: KpiStat[];
  monthly: Array<{ month: string; revenue: number; growth: number }>;
  distribution: Array<{ name: string; value: number; color: string }>;
  funnel: Array<{ name: string; value: number }>;
};

const DATA_BY_CONTEXT: Record<DashboardChartsProps["context"], DashboardData> = {
  user: {
    kpis: [
      {
        label: "Portfolio Value",
        value: "$182,400",
        trendLabel: "+5.4%",
        trend: [
          { name: "W1", value: 122 },
          { name: "W2", value: 129 },
          { name: "W3", value: 131 },
          { name: "W4", value: 138 },
          { name: "W5", value: 145 }
        ]
      },
      {
        label: "Monthly Yield",
        value: "14.7%",
        trendLabel: "+1.2pts",
        trend: [
          { name: "W1", value: 86 },
          { name: "W2", value: 88 },
          { name: "W3", value: 91 },
          { name: "W4", value: 93 },
          { name: "W5", value: 97 }
        ]
      },
      {
        label: "Active Assets",
        value: "11",
        trendLabel: "+2",
        trend: [
          { name: "W1", value: 42 },
          { name: "W2", value: 45 },
          { name: "W3", value: 44 },
          { name: "W4", value: 47 },
          { name: "W5", value: 52 }
        ]
      },
      {
        label: "Cash Available",
        value: "$24,960",
        trendLabel: "Stable",
        trend: [
          { name: "W1", value: 90 },
          { name: "W2", value: 88 },
          { name: "W3", value: 89 },
          { name: "W4", value: 90 },
          { name: "W5", value: 90 }
        ]
      }
    ],
    monthly: [
      { month: "Jan", revenue: 18, growth: 12 },
      { month: "Feb", revenue: 24, growth: 15 },
      { month: "Mar", revenue: 21, growth: 13 },
      { month: "Apr", revenue: 28, growth: 18 },
      { month: "May", revenue: 31, growth: 21 },
      { month: "Jun", revenue: 33, growth: 23 }
    ],
    distribution: [
      { name: "Residential", value: 42, color: "#2FC6FF" },
      { name: "Commercial", value: 30, color: "#7C3AED" },
      { name: "Hospitality", value: 18, color: "#A78BFA" },
      { name: "Logistics", value: 10, color: "#60A5FA" }
    ],
    funnel: [
      { name: "Visitors", value: 4200 },
      { name: "Qualified", value: 1900 },
      { name: "KYC Complete", value: 1270 },
      { name: "Invested", value: 780 }
    ]
  },
  admin: {
    kpis: [
      {
        label: "Gross Volume",
        value: "$3.2M",
        trendLabel: "+8.1%",
        trend: [
          { name: "W1", value: 118 },
          { name: "W2", value: 122 },
          { name: "W3", value: 126 },
          { name: "W4", value: 132 },
          { name: "W5", value: 141 }
        ]
      },
      {
        label: "Mint Throughput",
        value: "1,128",
        trendLabel: "+11.4%",
        trend: [
          { name: "W1", value: 70 },
          { name: "W2", value: 76 },
          { name: "W3", value: 81 },
          { name: "W4", value: 88 },
          { name: "W5", value: 96 }
        ]
      },
      {
        label: "Completion Rate",
        value: "96.4%",
        trendLabel: "+0.8pts",
        trend: [
          { name: "W1", value: 91 },
          { name: "W2", value: 92 },
          { name: "W3", value: 94 },
          { name: "W4", value: 95 },
          { name: "W5", value: 96 }
        ]
      },
      {
        label: "Ops Risk Alerts",
        value: "7",
        trendLabel: "-2",
        trend: [
          { name: "W1", value: 64 },
          { name: "W2", value: 61 },
          { name: "W3", value: 58 },
          { name: "W4", value: 56 },
          { name: "W5", value: 53 }
        ]
      }
    ],
    monthly: [
      { month: "Jan", revenue: 36, growth: 18 },
      { month: "Feb", revenue: 38, growth: 19 },
      { month: "Mar", revenue: 42, growth: 22 },
      { month: "Apr", revenue: 46, growth: 25 },
      { month: "May", revenue: 53, growth: 27 },
      { month: "Jun", revenue: 56, growth: 30 }
    ],
    distribution: [
      { name: "Primary Sales", value: 37, color: "#2FC6FF" },
      { name: "Secondary", value: 24, color: "#7C3AED" },
      { name: "Treasury", value: 21, color: "#A78BFA" },
      { name: "Ops", value: 18, color: "#60A5FA" }
    ],
    funnel: [
      { name: "Job Queued", value: 760 },
      { name: "Prepared", value: 690 },
      { name: "Submitted", value: 655 },
      { name: "Confirmed", value: 621 }
    ]
  },
  marketplace: {
    kpis: [
      {
        label: "Listings Live",
        value: "126",
        trendLabel: "+9",
        trend: [
          { name: "W1", value: 90 },
          { name: "W2", value: 91 },
          { name: "W3", value: 95 },
          { name: "W4", value: 99 },
          { name: "W5", value: 108 }
        ]
      },
      {
        label: "Avg Ticket",
        value: "$2,940",
        trendLabel: "+4.9%",
        trend: [
          { name: "W1", value: 76 },
          { name: "W2", value: 79 },
          { name: "W3", value: 78 },
          { name: "W4", value: 84 },
          { name: "W5", value: 87 }
        ]
      },
      {
        label: "Liquidity Score",
        value: "82/100",
        trendLabel: "+3",
        trend: [
          { name: "W1", value: 66 },
          { name: "W2", value: 67 },
          { name: "W3", value: 69 },
          { name: "W4", value: 73 },
          { name: "W5", value: 76 }
        ]
      },
      {
        label: "Buyers Active",
        value: "3,412",
        trendLabel: "+12.8%",
        trend: [
          { name: "W1", value: 52 },
          { name: "W2", value: 55 },
          { name: "W3", value: 57 },
          { name: "W4", value: 60 },
          { name: "W5", value: 66 }
        ]
      }
    ],
    monthly: [
      { month: "Jan", revenue: 22, growth: 11 },
      { month: "Feb", revenue: 24, growth: 13 },
      { month: "Mar", revenue: 27, growth: 15 },
      { month: "Apr", revenue: 30, growth: 18 },
      { month: "May", revenue: 32, growth: 20 },
      { month: "Jun", revenue: 35, growth: 22 }
    ],
    distribution: [
      { name: "Top Tier", value: 28, color: "#2FC6FF" },
      { name: "Mid Tier", value: 33, color: "#7C3AED" },
      { name: "Starter", value: 24, color: "#A78BFA" },
      { name: "Pre-Sale", value: 15, color: "#60A5FA" }
    ],
    funnel: [
      { name: "Visits", value: 5400 },
      { name: "Watchlist", value: 2800 },
      { name: "Intent", value: 1690 },
      { name: "Orders", value: 960 }
    ]
  }
};

const TITLE_BY_CONTEXT: Record<DashboardChartsProps["context"], string> = {
  user: "Investor Intelligence",
  admin: "Operations Intelligence",
  marketplace: "Marketplace Pulse"
};

function shortDayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function DashboardCharts({ context, adminChartsData }: DashboardChartsProps) {
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setChartsReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const data = useMemo(() => {
    if (context !== "admin" || !adminChartsData) {
      return DATA_BY_CONTEXT[context];
    }

    const attemptsByDay = adminChartsData.attemptsByDay.slice(-30);
    const revenueByDay = adminChartsData.revenueByDay;
    if (!attemptsByDay.length && !revenueByDay.length) {
      return DATA_BY_CONTEXT[context];
    }

    const revenueByDayMap = new Map(
      revenueByDay.map((item) => [item.day, item.revenueLamports])
    );

    const monthly = attemptsByDay.map((item) => ({
      month: shortDayLabel(item.day),
      revenue: Number((revenueByDayMap.get(item.day) ?? 0) / 1_000_000_000),
      growth: item.confirmed
    }));

    return {
      ...DATA_BY_CONTEXT[context],
      monthly
    };
  }, [adminChartsData, context]);

  const title = TITLE_BY_CONTEXT[context];

  const echartsOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      grid: { top: 22, right: 24, bottom: 30, left: 24 },
      tooltip: {
        trigger: "axis",
        borderColor: "rgba(255,255,255,0.2)",
        backgroundColor: "rgba(11,16,31,0.92)",
        textStyle: { color: "#E2E8F0" }
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.24)" } },
        axisLabel: { color: "#CBD5E1" },
        data: data.monthly.map((item) => item.month)
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "#CBD5E1" }
      },
      series: [
        {
          name: "Revenue",
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: "#2FC6FF" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(47, 198, 255, 0.35)" },
                { offset: 1, color: "rgba(47, 198, 255, 0.02)" }
              ]
            }
          },
          data: data.monthly.map((item) => item.revenue)
        },
        {
          name: "Growth",
          type: "bar",
          barWidth: 10,
          itemStyle: {
            color: "rgba(124, 58, 237, 0.65)",
            borderRadius: [8, 8, 0, 0]
          },
          data: data.monthly.map((item) => item.growth)
        }
      ]
    }),
    [data.monthly]
  );

  if (!chartsReady) {
    return (
      <section className="space-y-4" aria-hidden="true">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={`kpi-skeleton-${index}`} className="glass-surface p-4">
              <div className="space-y-3">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-8 w-20 rounded-full bg-white/10" />
                <div className="h-3 w-16 rounded-full bg-white/10" />
                <div className="h-12 w-full rounded-2xl bg-white/5" />
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <article className="glass-surface h-80 p-4 xl:col-span-2" />
          <article className="glass-surface h-80 p-4" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <article className="glass-surface h-96 p-4 xl:col-span-2" />
          <article className="glass-surface h-96 p-4" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <article key={kpi.label} className="glass-surface p-4">
            <div className="relative z-10 space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-white/65">{kpi.label}</p>
              <p className="text-2xl font-semibold text-white">{kpi.value}</p>
              <p className="text-xs text-cyan-200">{kpi.trendLabel}</p>
              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={48}>
                  <LineChart data={kpi.trend}>
                    <Line type="monotone" dataKey="value" stroke="#2FC6FF" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="glass-surface p-4 xl:col-span-2">
          <div className="relative z-10">
            <p className="text-sm font-semibold text-white">Revenue & Growth Trend</p>
            <p className="mt-1 text-xs text-white/65">Recharts base chart for daily dashboard monitoring.</p>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
                <AreaChart data={data.monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`areaRevenue-${context}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2FC6FF" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#2FC6FF" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#CBD5E1" tickLine={false} axisLine={false} />
                  <YAxis stroke="#CBD5E1" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(11,16,31,0.92)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 12,
                      color: "#E2E8F0"
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2FC6FF" strokeWidth={3} fill={`url(#areaRevenue-${context})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>

        <article className="glass-surface p-4">
          <div className="relative z-10">
            <p className="text-sm font-semibold text-white">Portfolio Distribution</p>
            <p className="mt-1 text-xs text-white/65">Recharts donut for fast composition reading.</p>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
                <PieChart>
                  <Pie data={data.distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={72} outerRadius={102} paddingAngle={3}>
                    {data.distribution.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(11,16,31,0.92)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 12,
                      color: "#E2E8F0"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid gap-2">
              {data.distribution.map((slice) => (
                <div key={slice.name} className="flex items-center justify-between text-xs text-white/75">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                    {slice.name}
                  </span>
                  <span>{slice.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="glass-surface p-4 xl:col-span-2">
          <div className="relative z-10">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-xs text-white/65">ECharts hero chart for high-impact trend storytelling.</p>
            <div className="mt-4 h-80 w-full">
              <ReactECharts option={echartsOption} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
            </div>
          </div>
        </article>

        <article className="glass-surface p-4">
          <div className="relative z-10">
            <p className="text-sm font-semibold text-white">Conversion Funnel</p>
            <p className="mt-1 text-xs text-white/65">Recharts horizontal bars for stage drop-off clarity.</p>
            <div className="mt-4 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
                <BarChart data={data.funnel} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 6" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#CBD5E1", fontSize: 12 }} width={88} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(11,16,31,0.92)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 12,
                      color: "#E2E8F0"
                    }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]} fill="#7C3AED" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
