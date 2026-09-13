import React, { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Chip, Stack, FormControlLabel, Switch, Divider } from '@mui/material';
import { useAppContext } from '../../../hooks';
import { UserProfile } from '../../../types';

export default function StateDemo() {
  const { user, isAuthenticated, config, setUser, updateConfig, logout } = useAppContext();

  const [newRole, setNewRole] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  const [customId, setCustomId] = useState('usr-123');
  const [customName, setCustomName] = useState('Jane Doe');
  const [customEmail, setCustomEmail] = useState('jane.doe@example.com');

  const handleLogin = () => {
    setUser({
      id: config.features?.customUserFeatureFlag ? customId : 'usr-123',
      name: config.features?.customUserFeatureFlag ? customName : 'Jane Doe',
      email: config.features?.customUserFeatureFlag ? customEmail : 'jane.doe@example.com',
      roles: ['viewer', 'editor'],
      customAttributes: {
        someKey: 'someValue'
      }
    });
  };

  const handleAddRole = () => {
    if (newRole && user) {
      setUser({ ...user, roles: [...user.roles, newRole] });
      setNewRole('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    if (user) {
      setUser({ ...user, roles: user.roles.filter(r => r !== roleToRemove) });
    }
  };

  const handleAddAttribute = () => {
    if (newAttrKey && user) {
      setUser({
        ...user,
        customAttributes: {
          ...(user.customAttributes || {}),
          [newAttrKey]: newAttrValue
        }
      });
      setNewAttrKey('');
      setNewAttrValue('');
    }
  };

  return (
    <Box sx={{ p: 4, width: '100%', boxSizing: 'border-box' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        State Demo
      </Typography>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <Stack spacing={4} sx={{ flex: 1 }}>
          {/* User Auth Section */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>Authentication & User State</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Status: <strong>{isAuthenticated ? 'Logged In' : 'Logged Out'}</strong>
              </Typography>
              {isAuthenticated ? (
                <Button variant="outlined" color="error" onClick={logout}>Log Out</Button>
              ) : (
                <Box>
                  {config.features?.customUserFeatureFlag && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, maxWidth: 300 }}>
                      <TextField size="small" label="Custom ID" value={customId} onChange={(e) => setCustomId(e.target.value)} />
                      <TextField size="small" label="Custom Name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                      <TextField size="small" label="Custom Email" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} />
                    </Box>
                  )}
                  <Button variant="contained" color="primary" onClick={handleLogin}>Log In</Button>
                </Box>
              )}
            </Box>

            {isAuthenticated && user && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>User Roles</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {user.roles.map(role => (
                    <Chip
                      key={role}
                      label={role}
                      onDelete={() => handleRemoveRole(role)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    label="New Role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                  <Button variant="outlined" onClick={handleAddRole}>Add Role</Button>
                </Box>
              </Box>
            )}
          </Paper>

        </Stack>

        <Box sx={{ flex: 1 }}>
          {/* Full AppContext Inspector */}
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa', height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>AppContext inspector</Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: '#1e1e1e',
                color: '#d4d4d4',
                borderRadius: 1,
                overflowX: 'auto',
                fontSize: '0.875rem'
              }}
            >
              {JSON.stringify({
                isAuthenticated,
                user,
                config
              }, null, 2)}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
