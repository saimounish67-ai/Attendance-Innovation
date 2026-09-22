import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus } from 'lucide-react';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sessionName: '', date: '', time: '', venue: '', mentor: '', description: ''
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions', error);
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sessions', formData);
      fetchSessions();
      setIsModalOpen(false);
      setFormData({ sessionName: '', date: '', time: '', venue: '', mentor: '', description: '' });
    } catch (error) {
      console.error('Error creating session', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Innovation Sessions</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Session
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sessions.map(session => (
            <div key={session._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <h3 className="text-xl font-bold text-white">{session.sessionName}</h3>
                <p className="text-blue-100 text-sm mt-1">{new Date(session.date).toLocaleDateString()}</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{session.time}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{session.venue}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <User className="h-5 w-5 mr-3 text-gray-400" />
                  <span>Mentor: {session.mentor}</span>
                </div>
                {session.description && (
                  <p className="text-sm text-gray-500 mt-4 border-t pt-4">{session.description}</p>
                )}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              No sessions created yet.
            </div>
          )}
        </div>
      )}

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Session</h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Name</label>
                <input required type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md" 
                       value={formData.sessionName} onChange={e => setFormData({...formData, sessionName: e.target.value})} placeholder="e.g. AI Workshop" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input required type="date" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                         value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input required type="time" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                         value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Venue</label>
                <input required type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                       value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mentor Name</label>
                <input required type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                       value={formData.mentor} onChange={e => setFormData({...formData, mentor: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea className="mt-1 w-full p-2 border border-gray-300 rounded-md" rows="3"
                          value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Create Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
