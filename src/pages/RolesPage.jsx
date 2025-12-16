import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { roleService } from '../services/roleService';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <SecurityIcon /> Roles & Permissions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No roles found. Create your first role to get started.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {role.display_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {role.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={<PeopleIcon />}
                      label={role.user_count || 0}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<SecurityIcon />}
                      label={role.permission_count || 0}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {role.is_director && (
                      <Chip label="Director" color="error" size="small" />
                    )}
                    {role.is_system && (
                      <Chip label="System" color="primary" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(role)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {!role.is_system && (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(role.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Role Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
              helperText="Unique identifier (e.g., sales_manager)"
            />
            <TextField
              label="Display Name"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              fullWidth
              required
              helperText="Friendly name (e.g., Sales Manager)"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              helperText="Brief description of this role's purpose"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDirector}
                  onChange={(e) =>
                    setFormData({ ...formData, isDirector: e.target.checked })
                  }
                />
              }
              label="Director Role (elevated privileges)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
