import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { IndianRupee, Activity, TrendingUp } from 'lucide-react';

export default function Income() {
  const { currentUser } = useAuth();
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('phlebotomistId', '==', currentUser.uid),
      where('status', '==', 'Completed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompletedOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return unsubscribe;
  }, [currentUser]);

  const totalBaseCharge = completedOrders.reduce((sum, order) => sum + (order.baseCharge || 0), 0);
  const totalCommission = completedOrders.reduce((sum, order) => sum + (order.commission || 0), 0);
  const totalIncome = totalBaseCharge + totalCommission;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-800">Income Tracker</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center text-slate-400 mb-2">
            <Activity className="w-4 h-4 mr-2" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Completed Orders</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{completedOrders.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center text-teal-600 mb-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Total Commission</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{totalCommission.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-5 rounded-2xl shadow-md border-none flex flex-col text-white">
          <div className="flex items-center text-teal-100 mb-2">
            <IndianRupee className="w-4 h-4 mr-2 opacity-80" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Total Earnings</p>
          </div>
          <p className="text-2xl font-bold text-white">₹{totalIncome.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Earnings Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-100">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bill</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Base Charge</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Commission</th>
                <th scope="col" className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Earned</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">No completed orders yet.</td>
                </tr>
              ) : (
                completedOrders.map((order) => {
                  const net = (order.baseCharge || 0) + (order.commission || 0);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{order.patientName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">₹{order.totalCost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">₹{order.baseCharge}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">₹{order.commission}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-teal-600 bg-teal-50/0 group-hover:bg-teal-50/50 transition-colors text-right">₹{net.toFixed(2)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
