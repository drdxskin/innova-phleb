import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';

export default function AdminStaff() {
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'phlebotomist')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        // sort by createdAt if available
        data.sort((a, b) => b.createdAt - a.createdAt);
        setStaff(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    };
    fetchStaff();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Registered Phlebotomists</h1>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joined Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {staff.length === 0 ? (
                <tr>
                   <td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">No phlebotomists registered yet.</td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 flex items-center">
                       <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                         {member.name?.[0] || 'U'}
                       </div>
                       {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{member.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
