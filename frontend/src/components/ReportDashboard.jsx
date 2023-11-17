//import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
//import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import CheckIcon from '@mui/icons-material/Check';
import List from '@mui/material/List'
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import { useLocation } from "react-router-dom";
import { Container } from '@mui/material';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
//import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia'
import Modal from '@mui/material/Modal';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';
import AlertTitle from '@mui/material/AlertTitle';
import { wait } from '@testing-library/user-event/dist/utils';
//import { Card, CardContent } from '@mui/material';
import PropTypes from 'prop-types'; 
//import FuzzyDashboard from '/dashboard';
import React from 'react';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';   
import FuzzyDashboard from './FuzzyDashboard';
// ReportDashboard.js
//import React from 'react';
//import { Card, CardHeader, CardContent } from '@material-ui/core';

export default function ReportDashboard() {
    const dummyFiles = [
      {
        name: '2023-11-30',
        droneCount: 5,
       // timestamp: '2023-11-15T08:30:00',
        acceptanceResult: 'Accepted',
        testType: 'fuzzyTest',
        fuzzyTest: 'Passed'
      },
      {
        name: '2023-11-16',
        droneCount: 2,
      //  timestamp: '2023-11-16T10:45:00',
        acceptanceResult: 'Rejected',
        testType: 'simulationTest',
        simulationTest: 'Completed'
      }
    ];
  
    return (
      <div className="dashboard" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {dummyFiles.map((file, index) => (
          <Card key={file.name} style={{ marginBottom: '20px' }}>
            <CardHeader title={file.name} />
            <CardContent>
              <p>Drone Count: {file.droneCount}</p>
              <p>Timestamp: {file.timestamp}</p>
              <p>Acceptance Result: {file.acceptanceResult}</p>
              {file.testType === 'fuzzyTest' && <p>Fuzzy Test: {file.fuzzyTest}</p>}
              {file.testType === 'simulationTest' && <p>Simulation Test: {file.simulationTest}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }