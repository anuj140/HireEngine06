import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TeamMember } from '../../../packages/types';
import { loginCompanyUser, getCompanyProfileFromToken, fetchTeamMembers, updateTeamMember as apiUpdateTeamMember } from '../../../packages/api-client';

interface AuthContextType {
  user: TeamMember | null;
  isAuthLoading: boolean;
  team: TeamMember[];
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  updateTeam: (team: TeamMember[]) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TeamMember | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([]);

  const loadUserAndTeam = useCallback(async () => {
    const token = sessionStorage.getItem('company_token');
    if (token) {
      try {
        // The API returns an object like { success: true, recruiter: { ...user_data } }
        const response = await getCompanyProfileFromToken() as any;
        const userData = response.recruiter;
        if (!userData) {
          throw new Error("User data (recruiter object) not found in profile response");
        }

        // Normalize roles on refresh to be consistent with the login endpoint's response.
        if (userData.role === 'recruiter' || userData.role === 'Recruiter') { // This is a main recruiter from the Recruiter model
          userData.role = 'Admin';
        } else if (userData.role === 'team_member' || userData.role === 'HRManager' || userData.role === 'HR Manager') { // This is from the TeamMember model
          userData.role = 'HR Manager';
        }

        setUser(userData as TeamMember);
        if (userData.role === 'Admin') {
          const teamData = await fetchTeamMembers();
          setTeam(teamData);
        }
      } catch (error) {
        console.error("Failed to fetch company user from token", error);
        sessionStorage.removeItem('company_token');
        setUser(null);
      }
    }
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    loadUserAndTeam();
  }, [loadUserAndTeam]);

  const login = async (email: string, password?: string): Promise<void> => {
    const response = await loginCompanyUser({ email, password });
    sessionStorage.setItem('company_token', response.token);
    // DO: Add comment above each fix.
    // FIX: Correctly destructure the 'user' object from the login response instead of setting the entire response object to the user state.
    const loggedInUser = response.user;
    setUser(loggedInUser);
    if (loggedInUser.role === 'Admin') {
      const teamData = await fetchTeamMembers();
      setTeam(teamData);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('company_token');
    setUser(null);
  };

  const updateTeam = async (newTeam: TeamMember[]) => {
    setTeam(newTeam);
  };

  const value = { user, isAuthLoading, team, login, logout, updateTeam };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};