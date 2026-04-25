import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { FileUp, Trash2 } from 'lucide-react';

export default function Tests() {
  const [tests, setTests] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchTests = async () => {
    try {
      const qs = await getDocs(collection(db, 'tests'));
      const t = qs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTests(t);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tests');
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const batch = writeBatch(db);
          let count = 0;
          
          results.data.forEach((row: any) => {
            // Assume CSV columns are Test Name, Price
            const testName = row['Test Name'] || row['test_name'] || row['testName'];
            const price = parseFloat(row['Price'] || row['price']);
            
            if (testName && !isNaN(price)) {
              const newDocRef = doc(collection(db, 'tests'));
              batch.set(newDocRef, {
                testName,
                price,
                createdAt: Date.now()
              });
              count++;
            }
          });

          if (count > 0) {
            await batch.commit();
            alert(`Successfully added ${count} tests.`);
            fetchTests();
          } else {
            alert('No valid rows found. Ensure CSV has "Test Name" and "Price" columns.');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'tests');
        } finally {
          setIsUploading(false);
          // reset input
          if (e.target) e.target.value = '';
        }
      },
      error: (err) => {
        console.error(err);
        alert('Failed to parse CSV');
        setIsUploading(false);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    try {
      await deleteDoc(doc(db, 'tests', id));
      fetchTests();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tests/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">Master Price List</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
           <h2 className="font-bold text-slate-800">Bulk Upload Tests</h2>
           <p className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block uppercase">Update Price List for the system</p>
           <p className="text-xs text-slate-500 mt-2">Upload a CSV or Excel file containing "Test Name" and "Price" columns.</p>
        </div>
        
        <div className="mt-4 md:mt-0 relative group">
          <label className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-colors inline-flex items-center shadow-lg shadow-teal-600/20">
            <FileUp className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Select CSV File'}
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <table className="min-w-full text-sm divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Test Name</th>
              <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</th>
              <th scope="col" className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {tests.length === 0 ? (
              <tr>
                 <td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-medium bg-slate-50">No tests available. Upload a CSV to populate the list.</td>
              </tr>
            ) : (
              tests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{test.testName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-teal-600 font-medium">₹{test.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    <button onClick={() => handleDelete(test.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
