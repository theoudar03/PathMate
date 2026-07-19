import React, { useState, useEffect } from 'react';
import { Users, MessagesSquare, Calendar, Building, BookOpen, Clock, Activity, ShieldCheck, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="bg-surfaceVariant/30 backdrop-blur-md border border-surfaceVariant/50 rounded-3xl p-6 shadow-elevation1 flex items-start justify-between group hover:shadow-elevation2 transition-all">
    <div>
      <p className="text-onSurfaceVariant text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-onSurface group-hover:scale-105 origin-left transition-transform">{value}</h3>
      {trend && (
        <p className={`text-xs mt-2 font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-error'}`}>
          {trend} from yesterday
        </p>
      )}
    </div>
    <div className={`p-4 rounded-2xl ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('pm_admin_token');
        const res = await fetch('/api/admin/stats/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Mon', users: 400, aiQueries: 240 },
    { name: 'Tue', users: 300, aiQueries: 139 },
    { name: 'Wed', users: 200, aiQueries: 980 },
    { name: 'Thu', users: 278, aiQueries: 390 },
    { name: 'Fri', users: 189, aiQueries: 480 },
    { name: 'Sat', users: 239, aiQueries: 380 },
    { name: 'Sun', users: 349, aiQueries: 430 },
  ];

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-onSurface">Dashboard Overview</h1>
          <p className="text-onSurfaceVariant text-sm">Live campus metrics and AI system health</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-xl text-sm font-semibold border border-green-200">
          <Database size={16} />
          System Healthy
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} trend="+12" colorClass="bg-blue-100 text-blue-700" />
        <StatCard title="AI Chats Today" value={stats.aiChatsToday} icon={MessagesSquare} trend="+43" colorClass="bg-purple-100 text-purple-700" />
        <StatCard title="Upcoming Events" value={stats.upcomingEvents} icon={Calendar} colorClass="bg-orange-100 text-orange-700" />
        <StatCard title="Knowledge Docs" value={stats.aiDocs} icon={BookOpen} trend="+2" colorClass="bg-green-100 text-green-700" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="bg-surface border border-surfaceVariant rounded-2xl p-4 text-center">
          <p className="text-xs text-onSurfaceVariant uppercase font-bold tracking-wider mb-1">Clubs</p>
          <p className="text-xl font-bold text-onSurface">{stats.registeredClubs}</p>
        </div>
        <div className="bg-surface border border-surfaceVariant rounded-2xl p-4 text-center">
          <p className="text-xs text-onSurfaceVariant uppercase font-bold tracking-wider mb-1">Study Mats</p>
          <p className="text-xl font-bold text-onSurface">{stats.studyMaterials}</p>
        </div>
        <div className="bg-surface border border-surfaceVariant rounded-2xl p-4 text-center">
          <p className="text-xs text-onSurfaceVariant uppercase font-bold tracking-wider mb-1">Voice Queries</p>
          <p className="text-xl font-bold text-onSurface">{stats.voiceQueries}</p>
        </div>
        <div className="bg-surface border border-surfaceVariant rounded-2xl p-4 text-center">
          <p className="text-xs text-onSurfaceVariant uppercase font-bold tracking-wider mb-1">Notices</p>
          <p className="text-xl font-bold text-onSurface">{stats.noticesPublished}</p>
        </div>
        <div className="bg-surface border border-surfaceVariant rounded-2xl p-4 text-center">
          <p className="text-xs text-onSurfaceVariant uppercase font-bold tracking-wider mb-1">Pending Reg</p>
          <p className="text-xl font-bold text-onSurface">{stats.pendingRegistrations}</p>
        </div>
        <div className="bg-surface border border-surfaceVariant rounded-2xl p-4 text-center">
          <p className="text-xs text-onSurfaceVariant uppercase font-bold tracking-wider mb-1">Visitors</p>
          <p className="text-xl font-bold text-onSurface">{stats.todaysVisitors}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface border border-surfaceVariant rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-onSurface mb-6">Engagement Overview</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                <Tooltip cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="users" name="Active Users" stroke="#006493" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="aiQueries" name="AI Chat Queries" stroke="#7e5260" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-surface border border-surfaceVariant rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-onSurface">Recent Activity</h3>
            <button className="text-primary text-sm font-medium hover:underline">View All</button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {!stats.recentActivity || stats.recentActivity.length === 0 ? (
              <p className="text-sm text-onSurfaceVariant">No recent activity found.</p>
            ) : (
              stats.recentActivity.map((activity, index) => {
                // Determine colors based on action type
                let colorClass = "bg-blue-100 border-blue-500";
                if (activity.action_type.includes('delete')) colorClass = "bg-red-100 border-red-500";
                else if (activity.action_type.includes('publish')) colorClass = "bg-orange-100 border-orange-500";
                else if (activity.action_type.includes('create')) colorClass = "bg-green-100 border-green-500";

                return (
                  <div key={activity.id || index} className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-[-24px] before:w-0.5 before:bg-surfaceVariant last:before:hidden">
                    <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 z-10 ${colorClass}`}></div>
                    <p className="text-sm font-medium text-onSurface">{activity.description}</p>
                    <p className="text-xs text-onSurfaceVariant mt-1">
                      {new Date(activity.created_at).toLocaleString()} • {activity.admin_name || 'Admin'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
