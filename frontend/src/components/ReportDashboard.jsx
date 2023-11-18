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
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';   
import FuzzyDashboard from './FuzzyDashboard';
// ReportDashboard.js
//import React from 'react';
//import { Card, CardHeader, CardContent } from '@material-ui/core';

export default function ReportDashboard() {
  const [files, setFiles] = useState([
    {
      name: '2023-11-04-12-22-28_Batch_1',
      droneCount: 5,
      // timestamp: '2023-11-15T08:30:00',
      acceptanceResult: 'Accepted',
      testType: 'fuzzyTest',
      fuzzyTest: 'Passed',
    },
    {
      name: '2023-11-16',
      droneCount: 2,
      // timestamp: '2023-11-16T10:45:00',
      acceptanceResult: 'Rejected',
      testType: 'simulationTest',
      simulationTest: 'Completed',
    },
  ]);

  const [selectedFileContent, setSelectedFileContent] = useState(null);

  // Function to add a new file to the array
  const addFile = (newFile) => {
    setFiles([...files, newFile]);
  };

  // Function to get the name of a file by index
  const getFileName = (index) => {
    return files[index] ? files[index].name : null;
  };
  
  const [selectedFile, setSelectedFile] = useState(null);

  const handleClick = async (folderName) => {
    try {
      const response = await fetch(`http://localhost:5000/report-data/${folderName}`);
      const data = await response.json();
  
      console.log('Response:', response);
      
      if (response.ok) {
        const files = data.files;
        console.log('Files:', files);
        // Do something with the list of files in your React app
      } else {
        console.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching folder data:', error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
  };

  return (
    <div className="dashboard" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {files.map((file, index) => (
        <Card key={file.name} style={{ marginBottom: '20px' }} onClick={() => handleClick(file.name)}>
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

      {selectedFileContent && (
        <div>
          <h2>Selected File Content:</h2>
          <pre>{selectedFileContent}</pre>
          <button onClick={handleClose}>Close</button>
        </div>
      )}
    </div>
  );
}