import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [phlebMap, setPhlebMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch users for mapping UID to Name
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const pMap: Record<string, string> = {};
        querySnapshot.docs.forEach(doc => {
          if (doc.data().role === 'phlebotomist') {
            pMap[doc.id] = doc.data().name;
          }
        });
        setPhlebMap(pMap);
      } catch (error) {
         console.error('Failed to fetch users', error);
      }
    };
    fetchUsers();

    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return unsubscribe;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          All System Orders
        </h1>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tests Count</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cost</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Phleb</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500 bg-slate-50 font-medium">No orders found system-wide.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{order.patientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{order.tests?.length || 0} tests</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-teal-600">₹{order.totalCost}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                         {(phlebMap[order.phlebotomistId] || 'U')[0]}
                       </span>
                      {phlebMap[order.phlebotomistId] || order.phlebotomistId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase rounded-full 
                        ${order.status === 'Pending' ? 'bg-amber-50 text-amber-600' : ''}
                        ${order.status === 'Collected' ? 'bg-indigo-50 text-indigo-600' : ''}
                        ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : ''}
                      `}>
                        {order.status}
                      </span>
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
