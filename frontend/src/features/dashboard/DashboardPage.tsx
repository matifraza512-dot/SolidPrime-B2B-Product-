import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, FolderKanban, Activity, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { fetchKPIs, fetchActivity } from "./api";
import { KPICard } from "@/components/ui/KPICard";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = { active: "#34d399", lead: "#6366f1", churned: "#f87171" };

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const trendPlaceholder = [
  { month: "Feb", value: 12 }, { month: "Mar", value: 19 }, { month: "Apr", value: 14 },
  { month: "May", value: 25 }, { month: "Jun", value: 22 }, { month: "Jul", value: 30 },
];

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: kpis, isLoading } = useQuery({ queryKey: ["dashboard-kpis"], queryFn: fetchKPIs });
  const { data: activity } = useQuery({ queryKey: ["dashboard-activity"], queryFn: fetchActivity });

  if (isLoading || !kpis) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">Welcome back, {user?.first_name || "there"}</h1>
        <p className="text-sm text-muted">Here's what's happening across your business today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPICard icon={DollarSign} label="Revenue" value={currency.format(kpis.revenue.value)} delta={8.2} />
        <KPICard icon={Users} label="Customers" value={String(kpis.customers.value)} delta={kpis.customers.new_this_month} suffix={`+${kpis.customers.new_this_month} this month`} />
        <KPICard icon={FolderKanban} label="Active Projects" value={String(kpis.active_projects.value)} suffix={kpis.active_projects.note} />
        <KPICard icon={Zap} label="API Requests" value={String(kpis.api_requests.value)} suffix={kpis.api_requests.note} />
        <KPICard icon={Activity} label="Team Productivity" value={kpis.team_productivity.value !== null ? String(kpis.team_productivity.value) : "-"} suffix={kpis.team_productivity.note} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-primary">Revenue trend</h2>
          <p className="text-xs text-muted">Monthly recurring revenue (illustrative until Invoices module ships)</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendPlaceholder}>
                <CartesianGrid strokeDasharray="3 3" stroke="#24272f" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1c1f28", border: "1px solid #343842", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-primary">Customers by status</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis.customers_by_status}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {kpis.customers_by_status.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1c1f28", border: "1px solid #343842", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {kpis.customers_by_status.map((entry) => (
              <div key={entry.status} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[entry.status] }} />
                <span className="text-secondary capitalize">{entry.status}</span>
                <span className="font-tabular text-muted">{entry.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-primary">Recent activity</h2>
        <div className="mt-3 flex flex-col divide-y divide-border">
          {!activity?.length && <p className="py-6 text-center text-sm text-muted">No activity yet.</p>}
          {activity?.map((item) => (
            <div key={item.public_id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-xs font-medium text-secondary">
                  {item.actor_name[0]?.toUpperCase()}
                </div>
                <p className="text-sm text-secondary">
                  <span className="font-medium text-primary">{item.actor_name}</span> {item.description}
                </p>
              </div>
              <span className="text-xs text-muted font-tabular">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
