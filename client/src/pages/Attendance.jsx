import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Send, RefreshCw } from 'lucide-react';

const Attendance = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendance(selectedSession);
      setShowQR(false);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data);
      if (data.length > 0) setSelectedSession(data[0]._id);
    } catch (error) {
      console.error('Error fetching sessions', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/members');
      setMembers(data);
      
      // Initialize attendance state with defaults
      const initialAttendance = {};
      data.forEach(m => {
        initialAttendance[m._id] = 'Absent';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching members', error);
    }
  };

  const fetchAttendance = async (sessionId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/session/${sessionId}`);
      const attendanceMap = { ...attendance };
      
      // Reset all to absent first
      members.forEach(m => {
        attendanceMap[m._id] = 'Absent';
      });

      // Update with fetched records
      data.forEach(record => {
        if (record.memberId) {
           const memId = typeof record.memberId === 'object' ? record.memberId._id : record.memberId;
           attendanceMap[memId] = record.status;
        }
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance', error);
    }
    setLoading(false);
  };

  const handleToggle = (memberId) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: prev[memberId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    members.forEach(m => {
      updated[m._id] = status;
    });
    setAttendance(updated);
  };

  const handleSaveAttendance = async () => {
    try {
      const records = Object.keys(attendance).map(memberId => ({
        memberId,
        status: attendance[memberId]
      }));

      await api.post('/attendance/bulk', {
        sessionId: selectedSession,
        records
      });

      alert('Attendance saved successfully');
    } catch (error) {
      console.error('Error saving attendance', error);
      alert('Error saving attendance');
    }
  };

  const handleGeneratePDF = async () => {
    if (!window.confirm('This will generate the absentee PDF and email the HOD, Coordinator, and absent students. Proceed?')) return;
    
    try {
      await api.post(`/attendance/send-report/${selectedSession}`);
      alert('Reports generated and emails sent successfully!');
    } catch (error) {
      console.error('Error generating report', error);
      alert('Error generating report');
    }
  };

  const qrUrl = `${window.location.origin}/scan/${selectedSession}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <div className="flex items-center space-x-3">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            {sessions.map(s => (
              <option key={s._id} value={s._id}>{s.sessionName} ({new Date(s.date).toLocaleDateString()})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Scan QR to Mark Attendance</h2>
          
          {showQR ? (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100 mb-4">
                <QRCodeSVG value={qrUrl} size={200} level="H" />
              </div>
              <p className="text-sm text-gray-500 mb-4 break-all max-w-full px-4">{qrUrl}</p>
              <button 
                onClick={() => fetchAttendance(selectedSession)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Attendance List
              </button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center">
              <QrCode className="h-16 w-16 text-gray-300 mb-4" />
              <button
                onClick={() => setShowQR(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Generate QR Code
              </button>
            </div>
          )}
        </div>

        {/* Manual Attendance Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
            <h2 className="text-lg font-semibold text-gray-800">Manual Entry</h2>
            <div className="space-x-2 text-sm">
              <button onClick={() => handleMarkAll('Present')} className="text-blue-600 hover:underline">Mark All Present</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => handleMarkAll('Absent')} className="text-red-600 hover:underline">Mark All Absent</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map(member => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{member.teamId}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleToggle(member._id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          attendance[member._id] === 'Present' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {attendance[member._id] === 'Present' ? 'Present' : 'Absent'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl">
             <button
                onClick={handleGeneratePDF}
                className="flex items-center text-red-600 hover:text-red-800 font-medium text-sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Email Absentee Report
              </button>
             <button
              onClick={handleSaveAttendance}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
            >
              Save Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
