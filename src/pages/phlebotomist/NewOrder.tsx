import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search, FileText } from 'lucide-react';

export default function NewOrder() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [testsList, setTestsList] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  
  // Billing State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tests'));
        const testsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTestsList(testsData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'tests');
      } finally {
        setLoadingTests(false);
      }
    };
    fetchTests();
  }, []);

  const filteredTests = testsList.filter(t => 
    t.testName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedTests.find(st => st.id === t.id)
  );

  const addTest = (test: any) => {
    setSelectedTests([...selectedTests, test]);
    setSearchQuery('');
  };

  const removeTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  };

  const totalCost = selectedTests.reduce((sum, test) => sum + Number(test.price), 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (selectedTests.length === 0) {
      alert("Please add at least one test.");
      return;
    }

    setIsSubmitting(true);
    
    const baseCharge = 100;
    const commission = totalCost * 0.10;

    try {
      await addDoc(collection(db, 'orders'), {
        phlebotomistId: currentUser.uid,
        patientName,
        patientAge: parseInt(patientAge, 10),
        patientPhone,
        referringDoctor,
        patientAddress,
        tests: selectedTests.map(t => ({ testId: t.id, testName: t.testName, price: t.price })),
        totalCost,
        baseCharge,
        commission,
        status: 'Pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      navigate('/phleb/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">New Patient Registration</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* Patient Details box */}
        <div className="col-span-1 lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 h-fit">
          <div className="mb-6 border-b pb-4 border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center">
              New Patient Details
            </h2>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider bg-slate-50 px-2 py-1 rounded">TRX-{Math.floor(Math.random() * 900000) + 100000}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Patient Name <span className="text-red-500">*</span></label>
              <input required type="text" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow" placeholder="e.g. Amit Verma" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number <span className="text-red-500">*</span></label>
              <input required type="tel" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Age <span className="text-red-500">*</span></label>
              <input required type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow" placeholder="e.g. 45" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Referring Doctor</label>
              <input type="text" value={referringDoctor} onChange={e => setReferringDoctor(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow" placeholder="Dr. Sharma" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Exact Address / Location <span className="text-red-500">*</span></label>
            <textarea required value={patientAddress} onChange={e => setPatientAddress(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow resize-none" placeholder="Enter full address for sample collection..." />
          </div>
        </div>

        {/* Billing Module */}
        <div className="col-span-1 lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 h-fit flex flex-col">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
             <h2 className="font-bold text-slate-800">Billing Module</h2>
           </div>
           
           <div className="p-6 space-y-4 flex-1">
             <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Test Search (from Master List)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-teal-100 bg-teal-50/30 rounded-lg text-sm focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
                
                {searchQuery && filteredTests.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-[calc(100%-3rem)] sm:w-[calc(100%-8rem)] md:w-[calc(100%-12rem)] lg:w-80 bg-white shadow-xl max-h-48 rounded-xl py-1 overflow-auto border border-slate-200">
                    {filteredTests.map((test) => (
                      <li 
                        key={test.id} 
                        onClick={() => addTest(test)}
                        className="cursor-pointer select-none relative py-2.5 px-4 hover:bg-slate-50 flex justify-between group transition-colors"
                      >
                        <span className="block truncate font-medium text-sm text-slate-700">{test.testName}</span>
                        <span className="text-teal-600 font-bold text-sm">₹{test.price}</span>
                      </li>
                    ))}
                  </ul>
                )}
             </div>

             {/* Selected Tests List */}
             {selectedTests.length > 0 && (
               <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                  {selectedTests.map((test) => (
                    <div key={test.id} className="flex justify-between items-center text-sm group">
                      <div className="flex items-center gap-2">
                         <button type="button" onClick={() => removeTest(test.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                           <X className="w-4 h-4" />
                         </button>
                         <span className="text-slate-600 font-medium">{test.testName}</span>
                      </div>
                      <span className="font-bold text-slate-800">₹{test.price.toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between font-bold text-slate-800 items-center">
                    <span>Total Bill Value</span>
                    <span className="text-teal-600 text-lg">₹{totalCost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-emerald-600 font-bold uppercase tracking-wider pt-1">
                    <span>Your Estimated Earnings (10% + Base)</span>
                    <span>₹{(100 + (totalCost * 0.1)).toFixed(2)}</span>
                  </div>
               </div>
             )}

             <button
               type="submit"
               disabled={isSubmitting || selectedTests.length === 0}
               className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-4"
             >
               {isSubmitting ? 'Processing...' : 'Complete Registration & Bill'}
             </button>
           </div>
        </div>
      </form>
    </div>
  );
}
import { User } from 'lucide-react'; // quick import fix
