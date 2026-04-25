import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { IndianRupee, PieChart, Users, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [phlebMap, setPhlebMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uSnap = await getDocs(collection(db, 'users'));
        const pMap: Record<string, string> = {};
        uSnap.docs.forEach(doc => {
          if (doc.data().role === 'phlebotomist') pMap[doc.id] = doc.data().name;
        });
        setPhlebMap(pMap);

        const oSnap = await getDocs(collection(db, 'orders'));
        const ordersData = oSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    };
    fetchData();
  }, []);

  const totalSystemRevenue = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const totalCompletedOrders = orders.filter(o => o.status === 'Completed').length;
  
  // Calculate Phlebotomist Payouts (Base + Commission for Completed orders)
  const payouts: Record<string, { totalEarned: number, completedCount: number }> = {};
  
  orders.forEach(order => {
    if (order.status === 'Completed') {
       if (!payouts[order.phlebotomistId]) payouts[order.phlebotomistId] = { totalEarned: 0, completedCount: 0 };
       
       const base = order.baseCharge || 0;
       const comm = order.commission || 0;
       
       payouts[order.phlebotomistId].totalEarned += (base + comm);
       payouts[order.phlebotomistId].completedCount += 1;
    }
  });

  const totalPayoutLiability = Object.values(payouts).reduce((sum, p) => sum + p.totalEarned, 0);
  const netEarnings = totalSystemRevenue - totalPayoutLiability;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-800">Financials & Overview</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center text-slate-400 mb-2">
            <Activity className="w-4 h-4 mr-2" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Total Orders</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center text-emerald-500 mb-2">
            <PieChart className="w-4 h-4 mr-2" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{totalSystemRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center text-amber-500 mb-2">
            <Users className="w-4 h-4 mr-2" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Staff Payouts</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{totalPayoutLiability.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-5 rounded-2xl shadow-md border-none flex flex-col text-white">
          <div className="flex items-center text-teal-100 mb-2">
            <IndianRupee className="w-4 h-4 mr-2 opacity-80" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Net Profit</p>
          </div>
          <p className="text-2xl font-bold text-white">₹{netEarnings.toFixed(2)}</p>
        </div>

      </div>

      <div className="bg-white mt-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
           <h3 className="font-bold text-slate-800">Phlebotomist Payouts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-100">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phlebotomist Name</th>
                <th scope="col" className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Orders</th>
                <th scope="col" className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Earned (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.keys(payouts).length === 0 ? (
                <tr>
                   <td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">No payouts calculated yet.</td>
                </tr>
              ) : (
                Object.keys(payouts).map(pid => (
                  <tr key={pid} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                         {(phlebMap[pid] || 'U')[0]}
                      </div>
                      {phlebMap[pid] || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-center font-medium">
                      {payouts[pid].completedCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-teal-600 bg-teal-50/0 group-hover:bg-teal-50/50 transition-colors">
                      ₹{payouts[pid].totalEarned.toFixed(2)}
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
