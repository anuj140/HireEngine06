import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useToast } from '../hooks/useToast';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAdminAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            addToast('Welcome back, Admin!');
            navigate('/');
        } catch (error: any) {
            addToast(error.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-light">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-center text-dark-text">Admin Login</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                    </div>
                    <div>
                        <label htmlFor="password-admin" className="sr-only">Password</label>
                        <input id="password-admin" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-primary text-white p-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:bg-gray-400">
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
