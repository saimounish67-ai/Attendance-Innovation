import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    presentToday: 0,
    absentToday: 0,
    attendancePercent: 0
  });

  const [loading, setLoading] = useState(true);

  const [deptData, setDeptData] = useState({ labels: [], data: [] });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [membersRes, sessionsRes] = await Promise.all([
          api.get('/members'),
          api.get('/sessions')
        ]);
        
        const totalMembers = membersRes.data.length;
        const sessions = sessionsRes.data;
        
        let presentToday = 0;
        let absentToday = 0;
        
        if (sessions.length > 0) {
          const latestSession = sessions[0]; // Assuming sorted by date desc
          const attendanceRes = await api.get(`/attendance/session/${latestSession._id}`);
          const attendance = attendanceRes.data;
          
          presentToday = attendance.filter(a => a.status === 'Present').length;
          absentToday = attendance.filter(a => a.status === 'Absent').length;
        }
        
        const attendancePercent = totalMembers > 0 ? ((presentToday / totalMembers) * 100).toFixed(1) : 0;
        
        setStats({
          totalMembers,
          presentToday,
          absentToday,
          attendancePercent
        });

        // Compute department distribution from real members
        const deptCounts = {};
        membersRes.data.forEach(m => {
          deptCounts[m.department] = (deptCounts[m.department] || 0) + 1;
        });
        setDeptData({
          labels: Object.keys(deptCounts),
          data: Object.values(deptCounts)
        });

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Present',
        data: [45, 50, 48, 52, 49],
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
      },
      {
        label: 'Absent',
        data: [5, 2, 4, 1, 3],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      }
    ]
  };

  const chartColors = [
    'rgba(37, 99, 235, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(20, 184, 166, 0.8)',
  ];

  const doughnutData = {
    labels: deptData.labels,
    datasets: [
      {
        data: deptData.data,
        backgroundColor: deptData.labels.map((_, i) => chartColors[i % chartColors.length]),
        borderWidth: 0,
      }
    ]
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to InnoTrack - Smart Attendance System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={stats.totalMembers} icon={Users} color="bg-blue-500" />
        <StatCard title="Present Today" value={stats.presentToday} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Absent Today" value={stats.absentToday} icon={XCircle} color="bg-red-500" />
        <StatCard title="Attendance %" value={`${stats.attendancePercent}%`} icon={TrendingUp} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Attendance Trend</h3>
          <Bar data={barData} options={{ responsive: true }} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department-wise Participation</h3>
          <div className="w-2/3 mx-auto">
             <Doughnut data={doughnutData} options={{ responsive: true }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 flex items-center border border-gray-100">
    <div className={`${color} p-3 rounded-lg text-white`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
