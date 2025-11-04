import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

// Helper function to process and aggregate response data
const processChartData = (responses) => {
  if (!responses || responses.length === 0) {
    return [];
  }

  const answerCounts = {};

  // Assuming a question with the key 'identityComfort' exists in the response_data
  responses.forEach(response => {
    const answer = response.response_data?.identityComfort;
    if (answer) {
      answerCounts[answer] = (answerCounts[answer] || 0) + 1;
    }
  });

  // Convert the aggregated data into an array suitable for recharts
  return Object.keys(answerCounts).map(key => ({
    name: key,
    value: answerCounts[key],
  }));
};


const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({ totalSubmissions: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all responses
      const { data, error: responseError } = await supabase
        .from('questionnaire_responses')
        .select('response_data');

      if (responseError) throw responseError;

      setStats({ totalSubmissions: data.length });
      
      // Process data for the chart
      const processedData = processChartData(data);
      setChartData(processedData);

    } catch (err) {
      setError('Failed to fetch analytics data.');
      toast.error('Failed to fetch analytics data.');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (loading) {
    return <div className="p-6"><p className="text-gray-500">Loading analytics...</p></div>;
  }
  
  if (error) {
    return <div className="p-6"><p className="text-red-500">{error}</p></div>;
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

        <h3 className="text-lg font-medium text-gray-900 mb-4">"How comfortable are you expressing your identity?"</h3>
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Number of Responses" />
                  </BarChart>
              </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500">No data available for this chart yet.</p>
        )}
    </div>
  );
};

export default AnalyticsDashboard;