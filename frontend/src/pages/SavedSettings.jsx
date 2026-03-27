import React from 'react';
import { Box, Button, Card, CardActions, CardContent, Stack, Typography } from '@mui/material';
import {
  deleteSnapshot,
  downloadSnapshot,
  isSupported,
  listSnapshots,
} from '../services/savedSettingsStorage';

function formatSavedAt(lastModified) {
  return new Date(lastModified).toLocaleString();
}

export default function SavedSettings() {
  const [snapshots, setSnapshots] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
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

  const handleDownload = async (name) => {
    try {
      await downloadSnapshot(name);
      setError('');
    } catch (downloadError) {
      setError(downloadError.message || 'Failed to download saved settings.');
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

  return (
    <Box sx={{ minHeight: '70vh', px: 4, py: 5 }}>
      <Typography variant='h4' sx={{ mb: 1 }}>
        Saved Settings
      </Typography>
      <Typography sx={{ mb: 3 }}>
        Browser-private `settings.json` snapshots saved before simulation submission.
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
            </CardContent>
            <CardActions>
              <Button variant='outlined' onClick={() => handleDownload(snapshot.name)}>
                Download
              </Button>
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
