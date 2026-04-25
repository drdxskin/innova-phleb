import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export default function LoginAdmin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, userData, loading } = useAuth();
  
  if (!loading && currentUser && userData?.role === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (username.toLowerCase() !== 'innova' || password !== 'skynn') {
      setError('Invalid admin credentials.');
      setIsLoading(false);
      return;
    }

    try {
      // Under the hood, map to a secure Firebase account to retain Firestore Rules security
      const adminEmail = 'innova@innovalabs.com';
      const adminPass = 'skynn-admin-secured-pw';
      
      try {
        const result = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
        const docRef = doc(db, 'users', result.user.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists() || docSnap.data().role !== 'admin') {
           // Self-heal: setup as admin if role is missing
           await setDoc(docRef, {
             uid: result.user.uid,
             email: result.user.email,
             name: 'Master Admin',
             role: 'admin',
             createdAt: Date.now()
           });
        }
        navigate('/admin/dashboard');
      } catch (signInErr: any) {
        // If the account doesn't exist yet, create it on the fly
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/invalid-login-credentials') {
          try {
            const result = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
             const docRef = doc(db, 'users', result.user.uid);
             await setDoc(docRef, {
               uid: result.user.uid,
               email: result.user.email,
               name: 'Master Admin',
               role: 'admin',
               createdAt: Date.now()
             });
             navigate('/admin/dashboard');
          } catch (createErr: any) {
             if (createErr.code === 'auth/operation-not-allowed') {
                setError('Email/Password auth is disabled. Please go to your Firebase Console -> Authentication -> Sign-in method, and enable Email/Password.');
             } else {
                throw createErr;
             }
          }
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password auth is disabled. Please go to your Firebase Console -> Authentication -> Sign-in method, and enable Email/Password.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Browser privacy settings are likely blocking authentication inside this preview. Please click "Open App in New Tab" below to log in.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 items-center justify-center p-4 selection:bg-teal-100 selection:text-teal-900 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center text-teal-600">
             <ShieldCheck className="h-8 w-8" strokeWidth={2.5} />
           </div>
        </div>
        
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden relative border-t-[6px] border-t-teal-600">
          
          <div className="px-8 pt-8 pb-6 text-center space-y-1 relative z-10">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Innova Labs Admin</h1>
            <p className="text-sm font-medium text-slate-500">Master Administration Portal</p>
          </div>

          <div className="px-8 pb-8 relative z-10">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 text-center uppercase tracking-wide">
                {error}
              </div>
            )}
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Admin Username"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-800 hover:bg-slate-900 border border-transparent text-white py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Processing...' : 'Admin Sign In'}
              </button>
            </form>
            
            <div className="mt-6 text-center pt-6 border-t border-slate-100 space-y-4">
              <a href="/" className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-wider block">
                ← Back to Staff Portal
              </a>
              <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors uppercase tracking-wider flex items-center justify-center">
                <ExternalLink className="w-4 h-4 mr-1.5" /> Open App in New Tab
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
