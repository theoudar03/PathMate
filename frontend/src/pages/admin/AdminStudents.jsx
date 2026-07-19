import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Mail, User, BookOpen } from 'lucide-react';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('pm_admin_token');
        const res = await fetch('/api/admin/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          console.error("Backend returned an error:", data);
          setStudents([]);
        }
      } catch (err) {
        console.error("Error fetching students", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-onSurface">Student Directory</h1>
          <p className="text-onSurfaceVariant text-sm">Manage enrolled students and their profiles</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-onSurfaceVariant">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-surfaceVariant rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm text-onSurface"
            />
          </div>
          <button className="bg-surfaceVariant hover:bg-surfaceVariant/80 text-onSurface p-2.5 rounded-xl border border-surfaceVariant/50 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-surface border border-surfaceVariant rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surfaceVariant/30 text-onSurfaceVariant border-b border-surfaceVariant/50">
              <tr>
                <th className="px-6 py-4 font-medium">Student Info</th>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Stay / Accom.</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surfaceVariant/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-onSurfaceVariant">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-onSurfaceVariant">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-surfaceVariant/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-surfaceVariant" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primaryContainer text-onPrimaryContainer flex items-center justify-center font-bold font-heading">
                            {student.name ? student.name.charAt(0) : 'S'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-onSurface group-hover:text-primary transition-colors">{student.name}</p>
                          <p className="text-xs text-onSurfaceVariant flex items-center gap-1 mt-0.5">
                            <Mail size={12} /> {student.username || 'No Auth'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-surfaceVariant/50 px-2.5 py-1 rounded-md text-onSurface font-mono text-xs font-semibold tracking-wider">
                        {student.username || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-onSurfaceVariant" />
                        <span className="text-onSurface font-medium">{student.department_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-onSurface">
                      {student.stay_type === 'hostel' ? 'Hosteller' : student.stay_type === 'day_scholar' ? 'Day Scholar' : 'N/A'}
                      {student.hostel_block ? ` - ${student.hostel_block} Block` : ''}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-onSurfaceVariant hover:text-primary p-2 rounded-lg hover:bg-surfaceVariant transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        {!loading && filteredStudents.length > 0 && (
          <div className="px-6 py-4 border-t border-surfaceVariant/50 flex items-center justify-between text-sm text-onSurfaceVariant bg-surfaceVariant/10">
            <p>Showing {filteredStudents.length} of {students.length} students</p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-surfaceVariant bg-surface hover:bg-surfaceVariant transition-colors disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1.5 rounded-lg border border-surfaceVariant bg-surface hover:bg-surfaceVariant transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudents;
