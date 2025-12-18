
import React, { useEffect, useState, useMemo } from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with named imports from react-router-dom.
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserActivity } from '../contexts/UserActivityContext';
import { useToast } from '../contexts/ToastContext';
import { CheckCircleIcon, BriefcaseIcon, BuildingOfficeIcon } from '../components/Icons';
import { fetchJobById } from '../../../packages/api-client';
import { Job } from '../../../packages/types';

const ApplicationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { applyForJob, appliedJobIds } = useUserActivity();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<(string | boolean | null)[]>([]);
    const [applicationSubmitted, setApplicationSubmitted] = useState(false);

    const hasApplied = useMemo(() => appliedJobIds.has(id!), [appliedJobIds, id]);

    useEffect(() => {
        if (!id) { navigate('/jobs'); return; }
        if (!user) { navigate(`/login?redirect=/apply/${id}`); return; }

        if (hasApplied) {
            setIsLoading(true);
            fetchJobById(id).then(jobData => {
                setJob(jobData);
                setApplicationSubmitted(true);
            }).finally(() => setIsLoading(false));
            return;
        }

        const processApplication = async () => {
            setIsLoading(true);
            try {
                const jobData = await fetchJobById(id);
                if (!jobData) throw new Error('Job not found.');
                setJob(jobData);
                
                if (!jobData.questions || jobData.questions.length === 0) {
                    await applyForJob(id, []);
                    setApplicationSubmitted(true);
                } else {
                    setAnswers(jobData.questions.map(() => null));
                }
            } catch (e: any) {
                setError(e.message || 'Failed to process application.');
            } finally {
                setIsLoading(false);
            }
        };
        processApplication();
    }, [id, user, navigate, addToast, applyForJob, hasApplied]);

    const handleAnswerChange = (index: number, answer: string | boolean) => {
        const newAnswers = [...answers];
        newAnswers[index] = answer;
        setAnswers(newAnswers);
    };

    const handleSubmitWithAnswers = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job || !job.questions) return;
    
        const answersToSubmit = job.questions.map((q, index) => {
            return {
                question: q.question,
                answer: answers[index]
            };
        });

        if (answersToSubmit.some(a => a.answer === null || a.answer === '')) {
            addToast("Please answer all questions.", "info");
            return;
        }
    
        setIsLoading(true);
        try {
            await applyForJob(job.id, answersToSubmit);
            setApplicationSubmitted(true);
        } catch (e: any) {
            setError(e.message || 'Failed to submit application.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold text-dark-gray">Processing your application...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="bg-light-gray flex items-center justify-center min-h-[80vh]">
                <div className="text-center bg-white p-10 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-red-600">Application Failed</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <Link to="/jobs" className="mt-6 inline-block bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary-dark">
                        Back to Jobs
                    </Link>
                </div>
            </div>
        );
    }

    if (applicationSubmitted) {
        return (
            <div className="bg-light-gray flex items-center justify-center min-h-[80vh]">
                <div className="text-center bg-white p-10 rounded-lg shadow-md max-w-2xl mx-auto animate-fade-in">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
                    <h1 className="text-3xl font-bold text-dark-gray mt-4">Application Successful!</h1>
                    {job && (
                        <>
                            <p className="text-gray-600 mt-2">You have successfully applied for the position of:</p>
                            <div className="text-left bg-gray-50 p-4 rounded-lg mt-6 border">
                                <h2 className="font-bold text-lg text-primary flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2"/>{job.title}</h2>
                                <p className="text-gray-700 flex items-center mt-1"><BuildingOfficeIcon className="w-5 h-5 mr-2"/>{job.company.name}</p>
                            </div>
                        </>
                    )}
                    <p className="text-sm text-gray-500 mt-6">
                        Your application is now being reviewed. You can track its status in your profile.
                    </p>
                    <div className="mt-8 flex justify-center space-x-4">
                        <Link to="/applied-jobs" className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
                            Track Application
                        </Link>
                         <Link to="/jobs" className="bg-white border border-gray-300 text-dark-gray font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                            Find More Jobs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Render Question Form
    return (
        <div className="bg-light-gray min-h-[80vh] py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <form onSubmit={handleSubmitWithAnswers} className="bg-white p-8 rounded-lg shadow-md space-y-6 animate-fade-in">
                    <h1 className="text-2xl font-bold text-dark-gray">Apply for {job?.title}</h1>
                    <p className="text-gray-600">Please answer the following questions from the recruiter.</p>
                    {job?.questions?.map((q, index) => (
                        <div key={index}>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{index + 1}. {q.question}</label>
                            {q.type === 'text' ? (
                                <textarea
                                    value={(answers[index] as string) || ''}
                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                    required
                                    rows={3}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                />
                            ) : (
                                <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`question-${index}`}
                                            checked={answers[index] === true}
                                            onChange={() => handleAnswerChange(index, true)}
                                            required
                                            className="form-radio h-4 w-4 text-primary focus:ring-primary"
                                        />
                                        <span className="ml-2 text-sm">Yes</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`question-${index}`}
                                            checked={answers[index] === false}
                                            onChange={() => handleAnswerChange(index, false)}
                                            required
                                            className="form-radio h-4 w-4 text-primary focus:ring-primary"
                                        />
                                        <span className="ml-2 text-sm">No</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-gray-400">
                            {isLoading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplicationPage;
