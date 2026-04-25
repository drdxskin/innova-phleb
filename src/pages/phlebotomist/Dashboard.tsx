import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { MapPin, User, Phone, Stethoscope, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../../components/Layout';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('phlebotomistId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      // Sort by creation desc in JS since Firestore requires composite index for query sorting
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return unsubscribe;
  }, [currentUser]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, updatedAt: Date.now() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Orders</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orders.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
            No orders found. Add a new bill to get started.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <User className="w-4 h-4 mr-2 text-slate-400" />
                    {order.patientName} <span className="ml-2 text-xs text-slate-500 font-medium">({order.patientAge}y)</span>
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {order.patientPhone}
                  </p>
                </div>
                <span className={cn(
                  "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full",
                  order.status === 'Pending' && "bg-amber-50 text-amber-600",
                  order.status === 'Collected' && "bg-indigo-50 text-indigo-600",
                  order.status === 'Completed' && "bg-emerald-50 text-emerald-600",
                )}>
                  {order.status}
                </span>
              </div>
              
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-600">{order.patientAddress}</p>
                </div>
                {order.referringDoctor && (
                  <div className="flex items-center">
                    <Stethoscope className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-600">Ref: {order.referringDoctor}</p>
                  </div>
                )}
                
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tests Included</p>
                  <ul className="text-xs text-slate-700 space-y-2">
                    {order.tests.map((t: any, i: number) => (
                      <li key={i} className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">{t.testName}</span>
                        <span className="font-bold">₹{t.price}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 bg-slate-50 -mx-5 px-5 -mb-5 pb-5">
                    <span className="text-sm font-bold text-slate-800">Total Value</span>
                    <span className="text-lg font-bold text-teal-600">₹{order.totalCost}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 flex gap-2">
                {order.status === 'Pending' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Collected')}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-teal-700 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Clock className="w-4 h-4 mr-2 text-teal-500" /> Mark Collected
                  </button>
                )}
                {order.status === 'Collected' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Completed')}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center shadow-lg shadow-teal-600/20"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Complete Order
                  </button>
                )}
                {order.status === 'Completed' && (
                  <div className="flex-1 text-center py-2 text-xs font-bold text-emerald-600 flex items-center justify-center bg-emerald-50 rounded-xl">
                    <CheckCircle className="w-4 h-4 mr-2" /> Completed
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
