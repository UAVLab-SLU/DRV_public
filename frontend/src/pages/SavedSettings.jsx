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
import { loadImportedConfigFromSnapshot } from '../services/configImport/importConfigurationSources';
import { BASE_URL } from '../utils/const';

function formatSavedAt(lastModified) {
  return new Date(lastModified).toLocaleString();
}

function buildLoadMessage(snapshotName, warnings) {
  if (warnings.length > 0) {
    return `Loaded "${snapshotName}" into the wizard with recovered fields. Review the notes below before submitting.`;
  }

  return `Loaded "${snapshotName}" into the wizard. You can keep editing before submission.`;
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
      const importableSnapshots = savedSnapshots.map((snapshot) => {
        // Saved entries reuse the same normalization rules as presets and uploaded files.
        const importResult = loadImportedConfigFromSnapshot(snapshot);
        return {
          ...snapshot,
          canLoad: importResult.ok,
          loadWarnings: importResult.warnings ?? [],
          loadErrors: importResult.errors ?? [],
        };
      });
      setSnapshots(importableSnapshots);
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
        currentSnapshots.filter((snapshot) => snapshot.name !== name),
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
          'Saved fuzzy-test entries cannot be simulated from a single settings.json snapshot.',
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

  const handleLoadIntoWizard = async (name) => {
    setBusySnapshotName(name);
    try {
      const snapshot = await readSnapshot(name);
      const importResult = loadImportedConfigFromSnapshot(snapshot);
      if (!importResult.ok) {
        throw new Error(
          importResult.errors?.join(' ') || 'Failed to load saved settings into the wizard.',
        );
      }

      // Router state keeps the wizard on the same shared import/apply path.
      navigate('/simulation', {
        state: {
          descs: 'Load or edit an existing simulation configuration.',
          title: 'Loaded Configuration',
          importedConfig: importResult.config,
          importStatus: {
            severity: importResult.warnings?.length ? 'warning' : 'success',
            message: buildLoadMessage(snapshot.displayName ?? name, importResult.warnings ?? []),
            details: importResult.warnings ?? [],
          },
        },
      });
    } catch (loadError) {
      setError(loadError.message || 'Failed to load saved settings into the wizard.');
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
        Browser-private simulation configs saved before submission. Each entry keeps the generated
        `settings.json`, the matching `task.json` payload when available, and a short run summary.
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
              <Typography variant='h6'>{snapshot.displayName ?? snapshot.name}</Typography>
              <Typography color='text.secondary' sx={{ mt: 0.5 }}>
                {snapshot.description}
              </Typography>
              {snapshot.location?.coordinates && (
                <Typography color='text.secondary'>
                  Coordinates: {snapshot.location.coordinates}
                </Typography>
              )}
              {snapshot.location?.attribution && (
                <Typography color='text.secondary'>
                  Location source: {snapshot.location.attribution}
                </Typography>
              )}
              {snapshot.droneQuips?.length > 0 && (
                <Box component='ul' sx={{ color: 'text.secondary', m: 0, mt: 1, pl: 2.5 }}>
                  {snapshot.droneQuips.map((drone, index) => (
                    <Typography
                      component='li'
                      key={`${snapshot.name}-${drone.name}-${index}`}
                      variant='body2'
                    >
                      {drone.quip}
                    </Typography>
                  ))}
                </Box>
              )}
              <Typography color='text.secondary'>
                Saved {formatSavedAt(snapshot.lastModified)}
              </Typography>
              <Typography color='text.secondary'>{(snapshot.size / 1024).toFixed(1)} KB</Typography>
              <Typography color='text.secondary'>
                {snapshot.hasTask
                  ? 'Includes task.json replay data and full wizard load support'
                  : 'Legacy settings-only snapshot. Wizard load is available, but some fields may be reconstructed from settings.json.'}
              </Typography>
              {!snapshot.canLoad && snapshot.loadErrors.length > 0 && (
                <Typography color='error.main'>{snapshot.loadErrors.join(' ')}</Typography>
              )}
              {snapshot.canLoad && snapshot.loadWarnings.length > 0 && (
                <Typography color='warning.main'>
                  Loading will recover some wizard fields from the saved settings file.
                </Typography>
              )}
            </CardContent>
            <CardActions>
              {snapshot.canLoad && (
                <Button
                  color='primary'
                  variant='outlined'
                  onClick={() => handleLoadIntoWizard(snapshot.name)}
                  disabled={busySnapshotName === snapshot.name}
                >
                  {busySnapshotName === snapshot.name ? 'Loading...' : 'Load Into Wizard'}
                </Button>
              )}
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
