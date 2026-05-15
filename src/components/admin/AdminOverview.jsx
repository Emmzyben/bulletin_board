import React from 'react';
import { Card } from "@/components/ui/card";
import { Users, MessageSquare, FileText, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_ACTIVITY = [
  { day: 'Mon', messages: 24 },
  { day: 'Tue', messages: 36 },
  { day: 'Wed', messages: 52 },
  { day: 'Thu', messages: 43 },
  { day: 'Fri', messages: 61 },
  { day: 'Sat', messages: 18 },
  { day: 'Sun', messages: 12 },
];

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );
}

export default function AdminOverview({ workspace, members = [] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Members" value={workspace?.member_count || members.length || 1} icon={Users} color="bg-primary" />
        <StatCard title="Messages" value="246" icon={MessageSquare} color="bg-emerald-500" />
        <StatCard title="GP Posts" value="18" icon={FileText} color="bg-amber-500" />
        <StatCard title="Huddle Min" value="142" icon={Phone} color="bg-purple-500" />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Message Activity (7 days)</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_ACTIVITY}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}