import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'React Dev', applications: 125, views: 300 },
  { name: 'UI/UX Designer', applications: 210, views: 450 },
  { name: 'Backend Eng', applications: 88, views: 200 },
  { name: 'Data Scientist', applications: 150, views: 350 },
];

const RecruiterDashboardChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md h-96">
        <h3 className="text-lg font-semibold text-dark-gray mb-4">Job Post Performance</h3>
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
            <Bar dataKey="views" fill="#8884d8" />
            <Bar dataKey="applications" fill="#4A90E2" />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default RecruiterDashboardChart;