import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { CONFIG_PRESET_REGISTRY } from '../../data/configPresets/registry';
import {
  loadImportedConfigFromJsonText,
  loadImportedConfigFromPreset,
} from '../../services/configImport/importConfigurationSources';

function joinMessages(messages) {
  return messages.filter(Boolean).join(' ');
}

function buildStatusFromResult(result, successMessage) {
  if (!result.ok) {
    return {
      severity: 'error',
      message: joinMessages(result.errors),
      details: result.warnings ?? [],
    };
  }

  return {
    severity: result.warnings?.length ? 'warning' : 'success',
    message: successMessage,
    details: result.warnings ?? [],
  };
}

export default function ImportConfigurationPanel({
  presets = CONFIG_PRESET_REGISTRY,
  onImportConfig,
}) {
  const [selectedPresetId, setSelectedPresetId] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [status, setStatus] = React.useState(null);
  const [isWorking, setIsWorking] = React.useState(false);

  const selectedPreset = React.useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId) ?? null,
    [presets, selectedPresetId],
  );

  const getPresetLabel = React.useCallback(
    (preset) => preset?.displayName ?? preset?.name ?? preset?.id ?? 'Unnamed preset',
    [],
  );

  const commitImportResult = React.useCallback(
    (result, successMessage) => {
      const nextStatus = buildStatusFromResult(result, successMessage);
      setStatus(nextStatus);

      if (!result.ok) {
        return;
      }

      onImportConfig(result.config);
    },
    [onImportConfig],
  );

  const handlePresetImport = () => {
    if (!selectedPreset) {
      setStatus({
        severity: 'error',
        message: 'Choose a preset before loading it.',
        details: [],
      });
      return;
    }

    const result = loadImportedConfigFromPreset(selectedPreset);
    commitImportResult(
      result,
      `Loaded preset "${getPresetLabel(selectedPreset)}" into the wizard.`,
    );
  };

  const handleFileSelection = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
    setStatus(null);
  };

  const handleFileImport = async () => {
    if (!selectedFile) {
      setStatus({
        severity: 'error',
        message: 'Choose a JSON file before importing it.',
        details: [],
      });
      return;
    }

    setIsWorking(true);
    try {
      const rawText = await selectedFile.text();
      const result = loadImportedConfigFromJsonText(rawText, {
        sourceName: selectedFile.name,
      });
      commitImportResult(result, `Loaded "${selectedFile.name}" into the wizard.`);
    } catch (error) {
      setStatus({
        severity: 'error',
        message: `Unable to read "${selectedFile.name}": ${error.message}`,
        details: [],
      });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        mb: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant='h6' component='h3'>
            Load Existing Configuration
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            Supported sources: dev-team presets, saved snapshot bundles, raw task payloads, and
            AirSim `settings.json` files. Importing updates the wizard only. It does not submit or
            save anything.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          <Typography variant='subtitle2'>Dev-team presets</Typography>
          <FormControl size='small' fullWidth>
            <InputLabel id='import-preset-label'>Preset configuration</InputLabel>
            <Select
              labelId='import-preset-label'
              id='import-preset-select'
              label='Preset configuration'
              value={selectedPresetId}
              SelectDisplayProps={{ 'data-testid': 'import-preset-select' }}
              onChange={(event) => setSelectedPresetId(event.target.value)}
            >
              {presets.map((preset) => (
                <MenuItem key={preset.id} value={preset.id}>
                  {getPresetLabel(preset)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedPreset?.description && (
            <Typography variant='body2' color='text.secondary'>
              {selectedPreset.description}
            </Typography>
          )}
          <Box>
            <Button
              variant='outlined'
              onClick={handlePresetImport}
              data-testid='load-preset-button'
            >
              Load preset
            </Button>
          </Box>
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant='subtitle2'>Upload JSON from disk</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant='outlined' component='label'>
              Choose JSON file
              <input
                hidden
                type='file'
                accept='.json,application/json'
                data-testid='import-config-file-input'
                onChange={handleFileSelection}
              />
            </Button>
            <Typography variant='body2' color='text.secondary' data-testid='selected-import-file'>
              {selectedFile?.name ?? 'No file selected'}
            </Typography>
          </Box>
          <Box>
            <Button
              variant='contained'
              onClick={handleFileImport}
              disabled={isWorking}
              data-testid='load-file-button'
            >
              {isWorking ? 'Importing...' : 'Load file'}
            </Button>
          </Box>
        </Stack>

        {status && (
          <Alert severity={status.severity} data-testid='import-status'>
            <div>{status.message}</div>
            {status.details?.length > 0 && (
              <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                {status.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

const presetShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  displayName: PropTypes.string,
  name: PropTypes.string,
  description: PropTypes.string,
  sourceJson: PropTypes.object,
  config: PropTypes.object,
});

ImportConfigurationPanel.propTypes = {
  presets: PropTypes.arrayOf(presetShape),
  onImportConfig: PropTypes.func.isRequired,
};
