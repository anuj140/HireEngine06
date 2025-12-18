import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchRecruiterAnalytics } from '../../../packages/api-client';

const RecruiterDashboardChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchRecruiterAnalytics();
        if (response.success && response.data && response.data.jobPerformanceData) {
          setData(response.data.jobPerformanceData);
        }
      } catch (error) {
        console.error("Failed to load analytics chart data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-light-background p-6 rounded-2xl shadow-md h-96 border dark:border-dark-border flex items-center justify-center">
        <p>Loading chart data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-light-background p-6 rounded-2xl shadow-md h-96 border dark:border-dark-border">
      <h3 className="text-lg font-semibold text-dark-gray dark:text-dark-text mb-4">Job Post Performance</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="views" fill="#8884d8" name="Views (Est.)" />
          <Bar dataKey="applications" fill="#4A90E2" name="Applications" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RecruiterDashboardChart;