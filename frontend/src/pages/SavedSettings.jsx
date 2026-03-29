import React from 'react';
import { Box, Button, Card, CardActions, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  deleteSnapshot,
  downloadSettingsSnapshot,
  downloadTaskSnapshot,
  isSupported,
  listSnapshots,
  readSnapshot,
} from '../services/savedSettingsStorage';
import { BASE_URL } from '../utils/const';

function formatSavedAt(lastModified) {
  return new Date(lastModified).toLocaleString();
}

export default function SavedSettings() {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [busySnapshotName, setBusySnapshotName] = React.useState('');
  const opfsSupported = isSupported();

  const loadSnapshots = React.useCallback(async () => {
    if (!opfsSupported) {
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const savedSnapshots = await listSnapshots();
      setSnapshots(savedSnapshots);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load saved settings.');
    } finally {
      setLoading(false);
    }
  }, [opfsSupported]);

  React.useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const handleDownloadSettings = async (name) => {
    try {
      await downloadSettingsSnapshot(name);
      setError('');
    } catch (downloadError) {
      setError(downloadError.message || 'Failed to download settings.json.');
    }
  };

  const handleDownloadTask = async (name) => {
    try {
      await downloadTaskSnapshot(name);
      setError('');
    } catch (downloadError) {
      setError(downloadError.message || 'Failed to download task.json.');
    }
  };

  const handleDelete = async (name) => {
    try {
      await deleteSnapshot(name);
      setSnapshots((currentSnapshots) =>
        currentSnapshots.filter((snapshot) => snapshot.name !== name)
      );
      setError('');
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete saved settings.');
    }
  };

  const handleSimulate = async (name) => {
    setBusySnapshotName(name);
    try {
      const snapshot = await readSnapshot(name);
      if (!snapshot.hasTask) {
        throw new Error('This saved entry does not include task.json, so it cannot be simulated.');
      }
      if (!snapshot.canSimulate) {
        throw new Error(
          'Saved fuzzy-test entries cannot be simulated from a single settings.json snapshot.'
        );
      }

      const simulationPayload = {
        ...snapshot.taskJson,
        _prebuilt_settings: snapshot.settingsJson,
      };

      const response = await fetch(`${BASE_URL}/addTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationPayload),
      });
      const bodyText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${bodyText}`);
      }

      setError('');
      navigate('/reports');
    } catch (simulationError) {
      setError(simulationError.message || 'Failed to simulate saved settings.');
    } finally {
      setBusySnapshotName('');
    }
  };

  return (
    <Box sx={{ minHeight: '70vh', px: 4, py: 5 }}>
      <Typography variant='h4' sx={{ mb: 1 }}>
        Saved Settings
      </Typography>
      <Typography sx={{ mb: 3 }}>
        Browser-private snapshots of `settings.json` and, when available, the matching `task.json`
        payload saved before simulation submission.
      </Typography>

      {!opfsSupported && (
        <Typography color='error.main'>
          Browser private file storage requires OPFS support. Use a supported browser to save and
          manage settings snapshots.
        </Typography>
      )}

      {error && (
        <Typography color='error.main' sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {opfsSupported && loading && <Typography>Loading saved settings...</Typography>}

      {opfsSupported && !loading && snapshots.length === 0 && (
        <Typography>No saved settings snapshots yet.</Typography>
      )}

      <Stack spacing={2}>
        {snapshots.map((snapshot) => (
          <Card key={snapshot.name} variant='outlined'>
            <CardContent>
              <Typography variant='h6'>{snapshot.name}</Typography>
              <Typography color='text.secondary'>
                Saved {formatSavedAt(snapshot.lastModified)}
              </Typography>
              <Typography color='text.secondary'>
                {(snapshot.size / 1024).toFixed(1)} KB
              </Typography>
              <Typography color='text.secondary'>
                {snapshot.hasTask ? 'Includes task.json replay data' : 'Legacy settings-only snapshot'}
              </Typography>
            </CardContent>
            <CardActions>
              {snapshot.canSimulate && (
                <Button
                  color='success'
                  variant='outlined'
                  onClick={() => handleSimulate(snapshot.name)}
                  disabled={busySnapshotName === snapshot.name}
                >
                  {busySnapshotName === snapshot.name ? 'Simulating...' : 'Simulate'}
                </Button>
              )}
              <Button variant='outlined' onClick={() => handleDownloadSettings(snapshot.name)}>
                Download Settings
              </Button>
              {snapshot.hasTask && (
                <Button variant='outlined' onClick={() => handleDownloadTask(snapshot.name)}>
                  Download Task (Payload)
                </Button>
              )}
              <Button color='error' variant='outlined' onClick={() => handleDelete(snapshot.name)}>
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
