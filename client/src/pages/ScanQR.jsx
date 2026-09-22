import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, XCircle } from 'lucide-react';

const ScanQR = () => {
  const { sessionId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Recording your attendance...');

  useEffect(() => {
    if (!user) {
      // If not logged in, redirect to login, ideally with a return URL.
      // For simplicity, we just redirect to login here.
      navigate('/login');
      return;
    }
    
    // User is logged in, mark attendance
    const markAttendance = async () => {
      try {
        // We need the student's memberId, but currently they only have a user object.
        // Assuming the student user's username matches their teamId.
        // Let's fetch the member ID based on teamId.
        const membersRes = await api.get('/members');
        const member = membersRes.data.find(m => m.teamId === user.username);
        
        if (!member) {
          setStatus('error');
          setMessage('No team member record found for your account.');
          return;
        }

        await api.post('/attendance/mark', {
          memberId: member._id,
          sessionId: sessionId,
          status: 'Present'
        });

        setStatus('success');
        setMessage('Your attendance has been successfully recorded!');
      } catch (error) {
        console.error('Error marking attendance', error);
        setStatus('error');
        setMessage('Failed to record attendance. Please contact your mentor.');
      }
    };

    markAttendance();
  }, [sessionId, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-center">
        {status === 'processing' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">{message}</h2>
          </div>
        )}
        
        {status === 'success' && (
          <div>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full"
            >
              Go to Dashboard
            </button>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 w-full"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQR;
