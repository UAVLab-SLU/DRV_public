import React, { useEffect } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ReportDashboard from '../components/ReportDashboard';
import Loading from '../components/Loading';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LandscapeIcon from '@mui/icons-material/Landscape';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import { BASE_URL } from '../utils/const';
import { getErrorMessage } from '../utils/apiError';

const useStyles = makeStyles(() => ({
  landingPage: {
    fontFamily: 'Roboto, sans-serif',
    color: 'var(--dw-color-text-inverse)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    fontFamily: 'Arial, sans-serif',
    width: '100%',
  },
  siteTitle: {
    color: 'var(--dw-color-text-inverse)',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
  },
  mainContent: {},
  buttonContainer: {
    position: 'absolute',
    top: '6rem',
    right: '2rem',
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1rem',
  },
  navList: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    fontFamily: 'Arial, sans-serif',
  },
  navListItem: {
    display: 'inline-block',
    marginLeft: '1rem',
  },
  aboutLink: {
    textDecoration: 'none',
    color: 'var(--dw-color-text-inverse)',
    padding: '0.5rem 1rem',
    borderRadius: '30px',
    cursor: 'pointer',
  },
  acceptanceReportLink: {
    textDecoration: 'underline',
    color: 'var(--dw-color-text-link-accent)',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '1rem',
  },
  reportDashboardTitle: {
    textDecoration: 'underline',
    color: 'var(--dw-color-text-link-accent)',
    fontWeight: 'bold',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    cursor: 'pointer',
    textAlign: 'center',
  },
  createSimulationLink: {
    textDecoration: 'none',
    display: 'block',
    width: 'fit-content',
  },
}));

export default function LandingPage() {
  const classes = useStyles();
  const [filesPresent, setFilesPresent] = useState(false);
  const [isLoading, setIsloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsloading(true);
      try {
        const response = await fetch(`${BASE_URL}/list-reports`, { method: 'GET' });
        if (!response.ok) {
          const msg = await getErrorMessage(response);
          console.error('Error fetching report data:', msg);
          return;
        }
        const data = await response.json();
        const batchFiles = data.reports.filter((file) => file.filename.includes('Batch'));
        setFilesPresent(batchFiles.length > 0);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsloading(false);
      }
    };

    fetchData();
  }, []);

  const handleAccordionToggle = () => {
    console.log('Accordion toggled');
  };

  return (
    <div className={classes.landingPage}>
      <Box
        component='section'
        sx={{
          width: '100%',
          bgcolor: 'transparent',
          background: 'var(--dw-gradient-hero)',
          color: 'var(--dw-color-text-inverse)',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth='lg' sx={{ textAlign: 'center' }}>
          <Typography
            component='h1'
            sx={{
              fontWeight: 800,
              fontSize: { xs: 28, sm: 36, md: 44 },
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Advanced Drone
            <br />
            Simulation Platform
          </Typography>

          <Typography
            variant='h6'
            sx={{
              maxWidth: 760,
              mx: 'auto',
              color: 'var(--dw-color-text-inverse-muted)',
              fontWeight: 400,
              mb: 4,
            }}
          >
            Create realistic 3D environments, test multi-drone scenarios, and analyze performance
            with our comprehensive drone simulation platform.
          </Typography>

          <Stack
            direction='row'
            justifyContent='center'
            spacing={2}
            sx={{ flexWrap: 'wrap', rowGap: 2 }}
          >
            <Button
              component={Link}
              to='/home'
              variant='contained'
              size='large'
              startIcon={<PlayCircleOutlineIcon />}
              sx={{
                backgroundColor: 'var(--dw-color-primary)',
                '&:hover': { backgroundColor: 'var(--dw-color-primary-hover)' },
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                borderRadius: 2,
              }}
            >
              Get Started
            </Button>

            <Button
              component={Link}
              to=''
              variant='outlined'
              size='large'
              endIcon={<ArrowForwardIcon />}
              sx={{
                color: 'var(--dw-color-text-inverse)',
                borderColor: 'var(--dw-color-surface-glass-border)',
                '&:hover': {
                  borderColor: 'var(--dw-color-text-inverse)',
                  backgroundColor: 'var(--dw-color-surface-glass)',
                },
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                borderRadius: 2,
                bgcolor: 'transparent',
              }}
            >
              Learn More
            </Button>
          </Stack>
        </Container>
      </Box>

      <Box component='section' sx={{ bgcolor: 'var(--dw-color-surface)', py: { xs: 8, md: 10 } }}>
        <Container maxWidth='lg' sx={{ textAlign: 'center' }}>
          <Typography
            component='h2'
            sx={{
              fontWeight: 800,
              color: 'var(--dw-color-text-primary)',
              fontSize: { xs: 26, md: 34 },
              mb: 1.5,
            }}
          >
            Powerful Simulation Features
          </Typography>

          <Typography
            variant='body1'
            sx={{
              color: 'var(--dw-color-text-secondary)',
              maxWidth: 820,
              mx: 'auto',
              mb: 6,
            }}
          >
            Everything you need to develop, test, and optimize drone operations in a safe, virtual
            environment.
          </Typography>

          <Grid container spacing={3}>
            {/* Card 1 */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid var(--dw-color-border-muted)',
                }}
              >
                <Stack direction='row' spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'var(--dw-color-feature-purple-soft)',
                    }}
                  >
                    <LandscapeIcon sx={{ color: 'var(--dw-color-feature-purple)' }} />
                  </Box>
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, color: 'var(--dw-color-text-primary)', mb: 0.5 }}
                    >
                      3D Environment Generation
                    </Typography>
                    <Typography sx={{ color: 'var(--dw-color-text-secondary)' }}>
                      Create realistic terrains, cities, and landscapes for comprehensive drone
                      testing scenarios.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Card 2 */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid var(--dw-color-border-muted)',
                }}
              >
                <Stack direction='row' spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'var(--dw-color-feature-green-soft)',
                    }}
                  >
                    <ShowChartIcon sx={{ color: 'var(--dw-color-feature-green)' }} />
                  </Box>
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, color: 'var(--dw-color-text-primary)', mb: 0.5 }}
                    >
                      Real-time Simulation
                    </Typography>
                    <Typography sx={{ color: 'var(--dw-color-text-secondary)' }}>
                      Monitor and control multiple drones simultaneously with live data streaming
                      and analytics.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Card 3 */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid var(--dw-color-border-muted)',
                }}
              >
                <Stack direction='row' spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'var(--dw-color-feature-violet-soft)',
                    }}
                  >
                    <GroupWorkIcon sx={{ color: 'var(--dw-color-feature-violet)' }} />
                  </Box>
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, color: 'var(--dw-color-text-primary)', mb: 0.5 }}
                    >
                      Multi-drone Coordination
                    </Typography>
                    <Typography sx={{ color: 'var(--dw-color-text-secondary)' }}>
                      Test swarm intelligence and formation flight patterns with advanced
                      coordination algorithms.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Card 4 */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid var(--dw-color-border-muted)',
                }}
              >
                <Stack direction='row' spacing={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'var(--dw-color-feature-orange-soft)',
                    }}
                  >
                    <InsertChartOutlinedIcon sx={{ color: 'var(--dw-color-feature-orange)' }} />
                  </Box>
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, color: 'var(--dw-color-text-primary)', mb: 0.5 }}
                    >
                      Data Analytics
                    </Typography>
                    <Typography sx={{ color: 'var(--dw-color-text-secondary)' }}>
                      Comprehensive reporting and analysis tools to evaluate drone performance and
                      mission success.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        component='section'
        sx={{
          width: '80%',
          bgcolor: 'var(--dw-color-body-bg)',
          py: { xs: 6, md: 8 },
          borderTop: '1px solid var(--dw-color-border-muted)',
        }}
      >
        <Container maxWidth='lg'>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={8}>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: 'var(--dw-color-text-primary)',
                  fontSize: { xs: 22, md: 28 },
                  mb: 0.5,
                }}
              >
                Ready to start simulating?
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: 'var(--dw-color-info-strong)',
                  fontSize: { xs: 22, md: 28 },
                }}
              >
                Create your first test scenario today.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack
                direction='row'
                spacing={2}
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              >
                <Button
                  component={Link}
                  to='/home'
                  variant='contained'
                  sx={{
                    backgroundColor: 'var(--dw-color-primary)',
                    '&:hover': { backgroundColor: 'var(--dw-color-primary-hover)' },
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  to='https://oss-slu.github.io/projects/droneworld/about'
                  variant='outlined'
                  sx={{
                    borderColor: 'var(--dw-color-border)',
                    color: 'var(--dw-color-primary-hover)',
                    '&:hover': {
                      borderColor: 'var(--dw-color-border-muted)',
                      backgroundColor: 'var(--dw-color-surface)',
                    },
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    bgcolor: 'var(--dw-color-surface)',
                  }}
                >
                  View Documentation
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        <div className={classes.mainContent}>
          {filesPresent && (
            <div onClick={handleAccordionToggle}>
              <h2 className={classes.reportDashboardTitle}>
                <Link to='/reports' className={classes.reportDashboardTitle}>
                  <div style={{ textAlign: 'center' }}></div>
                </Link>
              </h2>
              <ReportDashboard />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
