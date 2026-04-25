import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error';
import { useAuth } from '../context/AuthContext';
import { BriefcaseMedical, ExternalLink } from 'lucide-react';

export default function LoginPhleb() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, userData, loading } = useAuth();
  
  if (!loading && currentUser && userData?.role === 'phlebotomist') {
    return <Navigate to="/phleb/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const docRef = doc(db, 'users', result.user.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists() || docSnap.data().role !== 'phlebotomist') {
          setError('This portal is strictly for Phlebotomists.');
          await auth.signOut();
        } else {
          navigate('/phleb/dashboard');
        }
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const docRef = doc(db, 'users', result.user.uid);
        
        try {
          await setDoc(docRef, {
            uid: result.user.uid,
            email: result.user.email,
            name: name || 'Phlebotomist',
            role: 'phlebotomist',
            createdAt: Date.now()
          });
          navigate('/phleb/dashboard');
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'users');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password auth is not enabled. Please go to your Firebase Console -> Authentication -> Sign-in method, and enable Email/Password.');
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-teal-600/20">
            <BriefcaseMedical className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800 tracking-tight">
          Innova Labs
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Phlebotomist Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 text-center uppercase tracking-wide">{error}</div>}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Rahul Sharma"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="you@example.com"
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
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-600/20 bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-4">
            <a href="/admin-login" className="text-sm text-slate-500 hover:text-slate-700 font-medium block">
              Go to Admin Portal
            </a>
            <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors uppercase tracking-wider flex items-center justify-center">
              <ExternalLink className="w-4 h-4 mr-1.5" /> Open App in New Tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
