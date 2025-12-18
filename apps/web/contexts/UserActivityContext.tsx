
import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Job, UserActivityContextType } from '../../../packages/types';
import { fetchSavedJobs, saveJobApi, unsaveJobApi, applyForJobApi, fetchAppliedJobs, withdrawApplicationApi } from '../../../packages/api-client';
import { useToast } from './ToastContext';

const UserActivityContext = createContext<UserActivityContextType | undefined>(undefined);

export const UserActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [viewedJobIds, setViewedJobIds] = useState(new Set<string>());
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set<string>());
  const [isSavedJobsLoading, setIsSavedJobsLoading] = useState(true);

  const refreshSavedJobs = useCallback(async () => {
    if (user) {
      setIsSavedJobsLoading(true);
      try {
        const jobs = await fetchSavedJobs();
        setSavedJobs(jobs);
      } catch (e) {
        console.error("Failed to fetch saved jobs", e);
        addToast('Could not load saved jobs.', 'error');
      } finally {
        setIsSavedJobsLoading(false);
      }
    } else {
      setSavedJobs([]);
      setIsSavedJobsLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    if (user) {
      refreshSavedJobs();
      fetchAppliedJobs().then(apps => setAppliedJobIds(new Set(apps.map(a => a.jobId)))).catch(e => console.error("Failed to fetch applied jobs", e));
    } else {
      setSavedJobs([]);
      setAppliedJobIds(new Set());
      setIsSavedJobsLoading(false);
    }
  }, [user, refreshSavedJobs]);

  const viewJob = useCallback((jobId: string) => {
    setViewedJobIds(prev => new Set(prev).add(jobId));
  }, []);
  
  const saveJob = useCallback(async (job: Job) => {
    if (!user) {
        addToast('Please log in to save jobs.', 'info');
        return;
    }
    if (savedJobs.some(j => j.id === job.id)) return;

    // Optimistic update
    const jobWithSavedDate = { ...job, savedAt: new Date().toISOString() };
    setSavedJobs(prev => [jobWithSavedDate, ...prev]);

    try {
        await saveJobApi(job.id);
        addToast('Job saved successfully!');
    } catch (e: any) {
        addToast(`Failed to save job: ${e.message}`, 'error');
        // Rollback on error
        setSavedJobs(prev => prev.filter(j => j.id !== job.id));
    }
  }, [user, addToast, savedJobs]);
  
  const unsaveJob = useCallback(async (jobId: string) => {
    if (!user) return;
    
    const jobToUnsave = savedJobs.find(j => j.id === jobId);
    if (!jobToUnsave) return;

    // Optimistic update
    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
    
    try {
        await unsaveJobApi(jobId);
        addToast('Job unsaved.', 'info');
    } catch (e: any) {
        addToast(`Failed to unsave job: ${e.message}`, 'error');
        // Rollback on error
        setSavedJobs(prev => [...prev, jobToUnsave]);
    }
  }, [user, addToast, savedJobs]);

  const isJobSaved = useCallback((jobId: string) => savedJobs.some(j => j.id === jobId), [savedJobs]);

  const applyForJob = useCallback(async (jobId: string, answers: any[] = []) => {
    if (!user) {
        addToast('Please log in to apply for jobs.', 'info');
        throw new Error("User not logged in");
    }
    try {
        const result = await applyForJobApi(jobId, answers);
        setAppliedJobIds(prev => new Set(prev).add(jobId));
        addToast(result.msg || 'Application submitted successfully!');
    } catch (e: any) {
        const errorMessage = (e as Error).message || 'An unknown error occurred.';
        addToast(errorMessage, errorMessage.includes('already applied') ? 'info' : 'error');
        throw e;
    }
  }, [user, addToast]);

  const withdrawApplication = useCallback(async (jobId: string) => {
    if (!user) return;
    try {
        await withdrawApplicationApi(jobId);
        setAppliedJobIds(prev => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
        });
    } catch (e: any) {
        const errorMessage = (e as Error).message || 'Failed to withdraw application.';
        addToast(errorMessage, 'error');
        throw e;
    }
  }, [user, addToast]);

  const savedJobIds = useMemo(() => new Set(savedJobs.map(j => j.id)), [savedJobs]);

  const value = useMemo(() => ({ viewedJobIds, savedJobs, savedJobIds, appliedJobIds, isSavedJobsLoading, viewJob, saveJob, unsaveJob, isJobSaved, applyForJob, withdrawApplication }), 
    [viewedJobIds, savedJobs, savedJobIds, appliedJobIds, isSavedJobsLoading, viewJob, saveJob, unsaveJob, isJobSaved, applyForJob, withdrawApplication]
  );

  return <UserActivityContext.Provider value={value}>{children}</UserActivityContext.Provider>;
};

export const useUserActivity = (): UserActivityContextType => {
  const context = useContext(UserActivityContext);
  if (!context) {
    throw new Error('useUserActivity must be used within a UserActivityProvider');
  }
  return context;
};
