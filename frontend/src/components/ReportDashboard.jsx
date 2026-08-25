import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Loading from './Loading';

const BASE_URL = typeof window !== 'undefined'
  ? (import.meta?.env?.VITE_API_URL ?? 'http://localhost:5000')
  : 'http://localhost:5000';

export default function ReportDashboard() {
  const [reportFiles, setReportFiles] = React.useState([]);
  const [isLoading, setIsloading] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isReportDashboard = location.pathname.includes('/report-dashboard');

  const redirectToHome = () => navigate('/');

  useEffect(() => {
    setIsloading(true);
    fetch(`${BASE_URL}/list-reports`, { method: 'GET' })
      .then((res) => {
        if (!res.ok) throw new Error('No response from server');
        return res.json();
      })
      .then((data) => setReportFiles(data.reports ?? []))
      .catch((error) => console.error('Error fetching report data:', error))
      .finally(() => setIsloading(false));
  }, []);

  const [snackOpen, setSnackOpen] = React.useState(true);

  const getFolderContents = (file) => {
    fetch(`${BASE_URL}/list-folder-contents/${file.filename}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (!res.ok) throw new Error('No response from server');
        return res.json();
      })
      .then((data) => {
        navigate('/dashboard', {
          state: {
            data,
            file: { fuzzy: file.contains_fuzzy, fileName: file.filename, fail: file.fail },
          },
        });
      })
      .catch((error) => console.error('Error fetching report data:', error));
  };

  return (
    <>
      <Box sx={{ width: '100vw', margin: 0, padding: 0 }} />

      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ textAlign: 'center', mt: 2.5, mb: 3.5 }}
      >
        <Link to="/report-dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
          Acceptance Report
        </Link>
        {isReportDashboard && (
          <Tooltip title="Home" placement="bottom">
            <HomeIcon
              sx={{ float: 'right', cursor: 'pointer', fontSize: '35px' }}
              onClick={redirectToHome}
            />
          </Tooltip>
        )}
      </Typography>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          {reportFiles.length === 0 && (
            <>
              <Snackbar
                open={snackOpen}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                autoHideDuration={60000}
                onClose={() => setSnackOpen(false)}
              >
                <Alert onClose={() => setSnackOpen(false)} severity="info">
                  No reports found
                </Alert>
              </Snackbar>
              <Container maxWidth="xl" sx={{ p: 1.25, alignContent: 'center' }} />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.25 }}>
                <Button variant="contained" color="primary" onClick={redirectToHome}>
                  Return to Home
                </Button>
              </Box>
            </>
          )}

          {reportFiles.length > 0 && (
            <Grid container spacing={2} sx={{ width: '100%', pl: '45px', justifyContent: 'flex-start' }}>
              {reportFiles.map((file) => {
                if (!file?.filename || file.filename.includes('.DS_Store')) return null;
                const parts = file.filename.split('_');
                if (parts.length < 2) return (
                  <Grid key={file.filename} item xs={12}>
                    <Accordion />
                  </Grid>
                );

                const datePart = parts[0];
                const batchName = parts.slice(1).join('_');
                const date = datePart.substring(0, 10);
                const time = datePart.substring(11, 19);
                const formattedDate = `${date.substring(5, 7)}-${date.substring(8, 10)}-${date.substring(0, 4)}`;
                const formattedTime = `${time.substring(0, 2)}:${time.substring(3, 5)}:${time.substring(6, 8)}`;
                const formattedTimestamp = `${formattedDate} ${formattedTime}`;
                const passedPercent = file.pass + file.fail > 0
                  ? Math.round((file.pass / (file.pass + file.fail)) * 100)
                  : 0;

                return (
                  <Grid key={file.filename} item xs={12}>
                    <Accordion sx={{ border: '1px solid #2196F3', borderRadius: '8px', boxShadow: '0 4px 8px rgba(33,150,243,0.2)' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Grid container alignItems="center">
                          <Grid item xs>
                            <Typography sx={{ fontWeight: 'bold', mr: 1.125 }}>
                              {formattedTimestamp}
                              <span style={{ fontStyle: 'italic', marginLeft: '9px' }}>{batchName}</span>
                              {file.contains_fuzzy && (
                                <Chip label="Fuzzy Test" sx={{ ml: 1.125, bgcolor: 'lightgreen', color: 'black' }} />
                              )}
                            </Typography>
                          </Grid>
                          <Grid item sx={{ ml: 'auto', display: 'flex', alignItems: 'center', position: 'relative' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                              {file.fail > 0 && (
                                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', mr: 1 }}>
                                  <Box sx={{ border: '1px solid red', borderRadius: '50%', width: 30, height: 30, overflow: 'hidden', ml: 0.5, position: 'relative' }}>
                                    <CircularProgress variant="determinate" size={30} thickness={8} value={Math.round((file.fail / (file.pass + file.fail)) * 100)} sx={{ color: 'rgba(255,0,0,0.3)' }} />
                                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '12px', color: 'red' }}>❌</span>
                                  </Box>
                                </Box>
                              )}
                              {file.pass > 0 && (
                                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', mr: 1 }}>
                                  <Box sx={{ border: '1px solid lightgreen', borderRadius: '50%', width: 30, height: 30, overflow: 'hidden', ml: 0.5, position: 'relative' }}>
                                    <CircularProgress variant="determinate" size={30} thickness={8} value={passedPercent} sx={{ color: 'lightgreen' }} />
                                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '12px', color: 'lightgreen' }}>✅</span>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Table sx={{ width: '30%' }} aria-label="report summary">
                          <TableBody>
                            <TableRow sx={{ borderBottomWidth: '2px' }}>
                              <TableCell sx={{ fontWeight: 'bold', color: 'blue' }}>Drone Count</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'green' }}>Pass</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'red' }}>Fail</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>{file.drone_count}</TableCell>
                              <TableCell>{file.pass}</TableCell>
                              <TableCell>{file.fail}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        <Box sx={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                          <Link
                            style={{ cursor: 'pointer', fontSize: '18px', paddingRight: '15px' }}
                            onClick={() => getFolderContents(file)}
                          >
                            Simulation Data
                          </Link>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}
    </>
  );
}

ReportDashboard.propTypes = {
  isHomePage: PropTypes.bool,
};
