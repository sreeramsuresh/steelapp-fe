import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { roleService } from '../services/roleService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';

export default function RolesPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [sortField, setSortField] = useState('displayName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    isDirector: false,
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getRoles();
      setRoles(data || []);
      setError(null);
    } catch (err) {
      setError(`Failed to load roles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name || '',
        displayName: role.display_name || '',
        description: role.description || '',
        isDirector: role.is_director || false,
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        displayName: '',
        description: '',
        isDirector: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      isDirector: false,
    });
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        display_name: formData.displayName,
        description: formData.description,
        is_director: formData.isDirector,
      };

      if (editingRole) {
        await roleService.updateRole(editingRole.id, payload);
      } else {
        await roleService.createRole(payload);
      }

      handleCloseDialog();
      loadRoles();
    } catch (err) {
      setError(`Failed to save role: ${err.message}`);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    try {
      await roleService.deleteRole(roleId);
      loadRoles();
    } catch (err) {
      setError(`Failed to delete role: ${err.message}`);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedRoles = () => {
    const sorted = [...roles].sort((a, b) => {
      let aVal = a[sortField === 'displayName' ? 'display_name' : sortField];
      let bVal = b[sortField === 'displayName' ? 'display_name' : sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  if (loading) {
    return <LoadingSpinner mode="block" message="Loading roles..." />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Back to settings"
          title="Back to settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lock className="w-8 h-8" /> Roles & Permissions
          </h1>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" /> Create Role
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {roles.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="No Roles Created"
          description="Create your first role to get started managing user permissions."
          action={<Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" /> Create Role
          </Button>}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('displayName')}
                >
                  Name {sortField === 'displayName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('description')}
                >
                  Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getSortedRoles().map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="font-semibold">{role.display_name}</div>
                    <div className="text-xs text-gray-500">{role.name}</div>
                  </TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      <Users className="w-3 h-3" /> {role.user_count || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                      <Lock className="w-3 h-3" /> {role.permission_count || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {role.is_director && (
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm font-medium">
                          Director
                        </span>
                      )}
                      {role.is_system && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                          System
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleOpenDialog(role)}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title="Edit role"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!role.is_system && (
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="role-name"
                  className="block text-sm font-medium mb-1"
                >
                  Role Name
                </label>
                <input
                  id="role-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., sales_manager"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier (e.g., sales_manager)
                </p>
              </div>
              <div>
                <label
                  htmlFor="role-display-name"
                  className="block text-sm font-medium mb-1"
                >
                  Display Name
                </label>
                <input
                  id="role-display-name"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sales Manager"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Friendly name (e.g., Sales Manager)
                </p>
              </div>
              <div>
                <label
                  htmlFor="role-description"
                  className="block text-sm font-medium mb-1"
                >
                  Description
                </label>
                <textarea
                  id="role-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this role's purpose"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Brief description of this role&apos;s purpose
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDirector"
                  checked={formData.isDirector}
                  onChange={(e) =>
                    setFormData({ ...formData, isDirector: e.target.checked })
                  }
                  className="w-4 h-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isDirector" className="text-sm font-medium">
                  Director Role (elevated privileges)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingRole ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
