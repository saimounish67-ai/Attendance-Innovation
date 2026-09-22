import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit, RefreshCw, AlertCircle, Users as UsersIcon } from 'lucide-react';

const Members = () => {
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    teamId: '', name: '', department: '', year: '', email: '', phone: ''
  });

  const canManageMembers = ['Mentor', 'Coordinator', 'HOD'].includes(user?.role);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await api.get('/members');
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching members', error);
      setFetchError(error.response?.data?.message || 'Failed to load team members from server.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ teamId: '', name: '', department: '', year: '', email: '', phone: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingId(member._id);
    setFormData({
      teamId: member.teamId,
      name: member.name,
      department: member.department,
      year: member.year,
      email: member.email,
      phone: member.phone
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/members/${editingId}`, formData);
      } else {
        await api.post('/members', formData);
      }
      await fetchMembers();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ teamId: '', name: '', department: '', year: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error saving member', error);
      alert(error.response?.data?.message || 'Error saving member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member? Their login account will also be removed.')) {
      try {
        await api.delete(`/members/${id}`);
        await fetchMembers();
      } catch (error) {
        console.error('Error deleting member', error);
        alert(error.response?.data?.message || 'Error deleting member');
      }
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.teamId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || member.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const departments = ['All', ...new Set(members.map(m => m.department))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {members.length} Total
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {canManageMembers 
              ? 'Manage innovation team members, departments, and credentials.' 
              : 'View innovation team member roster.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMembers}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors title='Refresh'"
            title="Refresh members list"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManageMembers && (
            <button
              onClick={openAddModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus className="h-5 w-5 mr-1.5" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span className="text-sm">{fetchError}</span>
          </div>
          <button 
            onClick={fetchMembers}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-semibold px-3 py-1 rounded-md transition"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase font-semibold">Dept:</span>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading team members...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  {canManageMembers && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 font-mono">
                      {member.teamId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {member.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-700">{member.email}</div>
                      <div className="text-xs text-gray-400">{member.phone}</div>
                    </td>
                    {canManageMembers && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => openEditModal(member)} 
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Edit member"
                        >
                          <Edit className="h-4 w-4 inline" />
                        </button>
                        <button 
                          onClick={() => handleDelete(member._id)} 
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded ml-2"
                          title="Delete member"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={canManageMembers ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                      <UsersIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="font-medium">No members found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {searchTerm || filterDept !== 'All' ? 'Try adjusting your search filters.' : 'Add members using the button above or ensure database is seeded.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Member' : 'Add New Member'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Team ID</label>
                <input required type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md" 
                       value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input required type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                       value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input required type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                         value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input required type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                         value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input required type="email" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                       value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input required type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                       value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingId ? 'Update Member' : 'Save Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
