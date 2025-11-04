import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Users, FilePlus, CheckCircle, HelpCircle, AlertTriangle } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => {
  const IconComponent = icon;
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center">
      <div className={`p-3 rounded-full mr-4 ${color}`}>
        <IconComponent className="text-white" size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.rpc('get_dashboard_analytics');

        if (error) throw error;
        setStats(data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(err.message);
        toast.error("Could not load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-full mr-4 float-left"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Failed to load analytics: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} color="bg-blue-500" />
      <StatCard title="Pending Suggestions" value={stats?.pending_suggestions ?? 0} icon={FilePlus} color="bg-yellow-500" />
      <StatCard title="Approved Suggestions" value={stats?.approved_suggestions ?? 0} icon={CheckCircle} color="bg-green-500" />
      <StatCard title="Total Questions" value={stats?.total_questions ?? 0} icon={HelpCircle} color="bg-purple-500" />
    </div>
  );
};

export default DashboardStats;