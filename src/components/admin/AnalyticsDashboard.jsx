import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({ totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      const { count, error } = await supabase
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true });

      if (error) {
        toast.error('Failed to fetch analytics data');
        console.error('Error fetching analytics:', error);
      } else {
        setStats({ totalSubmissions: count || 0 });
      }
      setLoading(false);
    };

    fetchAnalyticsData();
  }, []);

  // Example data for the chart
  const data = [
      { name: 'Category A', value: 400 },
      { name: 'Category B', value: 300 },
      { name: 'Category C', value: 200 },
      { name: 'Category D', value: 278 },
  ];

  if (loading) {
    return <div className="p-6"><p className="text-gray-500">Loading analytics...</p></div>;
  }

  return (
    <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.totalSubmissions}</p>
                <p className="text-gray-600 mt-1">Total Submissions</p>
            </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-4">Response Distribution (Example)</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Responses" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default AnalyticsDashboard;