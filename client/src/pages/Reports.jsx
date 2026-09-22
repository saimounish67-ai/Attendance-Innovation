import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { AlertTriangle, Download, FileText } from 'lucide-react';

const Reports = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const fetchDefaulters = async () => {
    try {
      const { data } = await api.get('/attendance/defaulters');
      setDefaulters(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching defaulters', error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Defaulters</h1>
          <p className="text-gray-500">View attendance analytics and warning lists</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-red-50">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="h-6 w-6 mr-3" />
            <h2 className="text-lg font-bold">Defaulter List (&lt; 75% Attendance)</h2>
          </div>
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
            {defaulters.length} Members
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions Attended</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {defaulters.map((item, index) => (
                  <tr key={index} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{item.member.name}</div>
                      <div className="text-xs text-gray-500">{item.member.teamId} • {item.member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.member.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-700">
                      {item.presentCount} / {item.totalSessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        {item.attendancePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
                {defaulters.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-gray-300 mb-3" />
                        <p>No defaulters found. Everyone has good attendance!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
