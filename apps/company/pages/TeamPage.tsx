import React, { useEffect, useState, useMemo } from "react";
import { useBreadcrumbs } from "../contexts/BreadcrumbContext";
import {
  UserPlusIcon,
  DotsVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  CloseIcon,
  PencilIcon,
} from "../components/Icons";
import { TeamMember, RecruiterPermissions } from "../../../packages/types";
import {
  fetchTeamMembers,
  inviteTeamMember,
  updateTeamMember,
  updateTeamMemberStatus,
  removeTeamMember,
} from "../../../packages/api-client";
import { useToast } from "../hooks/useToast";

const TeamPage: React.FC = () => {
  const { setCrumbs } = useBreadcrumbs();
  const { addToast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  useEffect(() => {
    setCrumbs([{ name: "Dashboard", path: "/dashboard" }, { name: "Team Management" }]);
    return () => setCrumbs([]);
  }, [setCrumbs]);

  const loadTeam = () => {
    setIsLoading(true);
    fetchTeamMembers()
      .then(setTeamMembers)
      .catch((err) => addToast(err.message, "error"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTeam();
  }, [addToast]);

  const handleAddMember = async (
    newMemberData: Omit<TeamMember, "id" | "lastActive" | "status" | "confirmPassword">
  ) => {
    try {
      await inviteTeamMember(newMemberData);
      addToast(`Invitation sent to ${newMemberData.email}`);
      loadTeam(); // Refresh the list
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const handleEditMember = async (updatedMember: TeamMember) => {
    try {
      const memberId = (updatedMember as any)._id || updatedMember.id;
      await updateTeamMember(memberId, updatedMember);
      addToast(`Member ${updatedMember.name} updated successfully.`);
      loadTeam(); // Refresh the list
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const openRemoveModal = (member: TeamMember) => {
    setMemberToRemove(member);
    setIsRemoveModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (memberToRemove) {
      try {
        const memberId = (memberToRemove as any)._id || memberToRemove.id;
        await removeTeamMember(memberId);
        addToast(`Member ${memberToRemove.name} has been removed.`, "info");
        setIsRemoveModalOpen(false);
        setMemberToRemove(null);
        loadTeam(); // Refresh list
      } catch (err: any) {
        addToast(err.message, "error");
      }
    }
  };

  const openEditModal = (member: TeamMember) => {
    setMemberToEdit(member);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setMemberToEdit(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dark-gray">Team Management</h1>
          // Todo: [Frontend] `api/v1/recruiter/team/invite` payload:{" "}
          {(name, email, role)}
          {/*
                    {
    "name": "Team-member 2nd",
    "email": "cadar92210@asurad.com",
    "role": "team_member",
    "password": "password",
    "permissions": {
        "canPostJobs": true,
        "canDownloadResumes": true
    }
}
                    
                    */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Add New Member
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8">
                      Loading team...
                    </td>
                  </tr>
                ) : (
                  teamMembers.map((member) => (
                    <MemberRow
                      key={(member as any)._id || member.id}
                      member={member}
                      onEdit={openEditModal}
                      onRemove={openRemoveModal}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(isAddModalOpen || memberToEdit) && (
        <AddEditMemberModal
          isOpen={isAddModalOpen || !!memberToEdit}
          onClose={closeAddModal}
          onSave={memberToEdit ? handleEditMember : handleAddMember}
          memberToEdit={memberToEdit}
        />
      )}

      {isRemoveModalOpen && memberToRemove && (
        <RemoveMemberModal
          isOpen={isRemoveModalOpen}
          onClose={() => setIsRemoveModalOpen(false)}
          onConfirm={handleConfirmRemove}
          memberName={memberToRemove.name}
        />
      )}
    </>
  );
};

const MemberRow: React.FC<{
  member: TeamMember;
  onEdit: (m: TeamMember) => void;
  onRemove: (m: TeamMember) => void;
}> = ({ member, onEdit, onRemove }) => {
  const isAdmin = member.role === "Admin";
  const { addToast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const StatusBadge: React.FC<{ status: TeamMember["status"] }> = ({ status }) => {
    const styles = {
      Active: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Paused: "bg-gray-100 text-gray-700",
    };
    const icons = {
      Active: <CheckCircleIcon className="w-4 h-4" />,
      Pending: <ClockIcon className="w-4 h-4" />,
      Paused: <ClockIcon className="w-4 h-4" />,
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}
      >
        {icons[status]}
        {status}
      </span>
    );
  };

  const handleStatusChange = async (newStatus: "active" | "paused" | "invited") => {
    setIsUpdatingStatus(true);
    try {
      // Use _id if available (MongoDB), fallback to id
      const memberId = (member as any)._id || member.id;
      await updateTeamMemberStatus(memberId, newStatus);
      addToast(`Status updated to ${newStatus}`);
      // Reload page to refresh team members list
      window.location.reload();
    } catch (err: any) {
      addToast(err.message || "Failed to update status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Map backend status to display status
  const displayStatus =
    member.status === "invited"
      ? "Pending"
      : member.status === "active"
      ? "Active"
      : "Paused";

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="font-semibold text-dark-gray">{member.name}</p>
        <p className="text-sm text-gray-500">{member.email}</p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {member.role === "team_member"
          ? "Team Member"
          : member.role === "recruiter"
          ? "Manager"
          : member.role}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {!isAdmin ? (
          <select
            value={member.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as "active" | "paused" | "invited")
            }
            disabled={isUpdatingStatus}
            className="text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-primary bg-gray-50"
          >
            <option value="invited">Invited</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        ) : (
          <StatusBadge status={displayStatus} />
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {member.lastActive}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {!isAdmin && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onEdit(member)}
              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onRemove(member)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

const AddEditMemberModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  memberToEdit: TeamMember | null;
}> = ({ isOpen, onClose, onSave, memberToEdit }) => {
  /* ... Modal implementation remains largely the same ... */
  const isEditMode = !!memberToEdit;
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: memberToEdit?.name || "",
    email: memberToEdit?.email || "",
    role: memberToEdit?.role || "recruiter",
    password: "",
    confirmPassword: "",
    permissions: memberToEdit?.permissions || {
      canPostJobs: true,
      canDownloadResumes: true,
    },
  });

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        name: memberToEdit.name,
        email: memberToEdit.email,
        role: memberToEdit.role,
        password: "",
        confirmPassword: "",
        permissions: memberToEdit.permissions || {
          canPostJobs: true,
          canDownloadResumes: true,
        },
      });
    }
  }, [memberToEdit]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [name]: checked },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match.", "error");
      return;
    }

    if (isEditMode && memberToEdit) {
      const payload: Partial<TeamMember> & { permissions?: RecruiterPermissions } = {
        name: formData.name,
        email: formData.email,
        role: formData.role as TeamMember["role"],
        permissions: formData.role === "recruiter" ? formData.permissions : undefined,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      onSave({ ...memberToEdit, ...payload });
    } else {
      // Add mode
      if (!formData.password) {
        addToast("Password is required for new members.", "error");
        return;
      }
      const { confirmPassword, ...newMemberData } = formData;
      onSave(newMemberData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isEditMode ? "Edit Team Member" : "Add New Member"}
          </h2>
          <button onClick={onClose}>
            <CloseIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <InputField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <InputField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isEditMode}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label={isEditMode ? "New Password (Optional)" : "Password"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditMode}
                placeholder={isEditMode ? "Leave blank to keep unchanged" : ""}
              />
              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!isEditMode && !!formData.password}
                placeholder={isEditMode ? "Confirm new password" : ""}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-gray">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="team_member">Team Member</option>
                <option value="recruiter">Manager</option>
              </select>
            </div>
            {formData.role === "team_member" && (
              <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                Team Members can post and manage jobs, view applicants, and shortlist
                candidates.
              </div>
            )}
            {formData.role === "recruiter" && (
              <div className="p-3 bg-purple-50 rounded-md text-sm text-purple-800">
                Managers can view analytics, approvals, and the dashboard. They cannot
                manage jobs directly.
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg"
            >
              {isEditMode ? "Save Changes" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const InputField: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
> = ({ label, ...props }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-dark-gray">
      {label}
    </label>
    <input
      {...props}
      id={props.name}
      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
    />
  </div>
);
const RemoveMemberModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
}> = ({ isOpen, onClose, onConfirm, memberName }) => {
  // Simplified remove modal without password confirmation
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Confirm Removal</h2>
        </div>
        <div className="p-6 space-y-4">
          <p>
            Are you sure you want to remove{" "}
            <span className="font-bold">{memberName}</span> from your team? This action
            cannot be undone.
          </p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg"
          >
            Remove Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
