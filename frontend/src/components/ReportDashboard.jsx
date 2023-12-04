import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
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
import { Card, CardContent, CardHeader, Typography } from '@mui/material';   
import FuzzyDashboard from './FuzzyDashboard'; 
//import ExpansionPanel from '@material-ui/core/ExpansionPanel';
// ReportDashboard.js
//import React from 'react';
//import { Card, CardHeader, CardContent } from '@material-ui/core';


const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 900,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };
  
  export default function ReportDashboard(parameter) {

    const [reportFiles, setReportFiles] = React.useState([]);  
   // const isFuzzy = file.filename.includes('Fuzzy');

   useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:5000/list-reports', { method: 'GET' })
        .then((res) => {
          if (!res.ok) {
            throw new Error('No response from server/something went wrong');
          }
          return res.json();
        })
        .then((data) => {
          // 'data.reports' containing filename and fuzzy info
          console.log('Report Files:', data.reports);
          setReportFiles(data.reports);
        })
        .catch((error) => {
          console.error('Error fetching report data:', error);
        });
    };
    fetchData();
  }, []); 
    
    return (
      <div className='dashboard'>
        <Grid container spacing={2}> 
         {reportFiles.map(file => (
           <Grid key={file.id} item xs={4}>
  
             <Card key={file.filename} sx={{ maxWidth: 400, height: 270, border: file.contains_fuzzy ? '1px solid lightgreen' : 'none'}}>
               <CardHeader title= "Report" sx ={{font: 'icon'}}/>
  
               <CardContent> 

                <p>{file.filename}</p>
                 <p>Drone Count: {file.drone_count}</p>  


                 {file.contains_fuzzy && (
                <p>Fuzzy Testing {file.contains_fuzzy}</p>
                )}

                {!file.contains_fuzzy && ( 
               <p>Simulation Testing</p>
                 )}
                 
                 
               </CardContent>  
               <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '10px' }}> 
               <Button  
               variant="contained"   
               sx={{ minWidth: '120px', marginLeft: '260px', fontSize: '0.8rem' }}  
               // onClick={() => navigateToReport(file.filename)} OnClick yet to be complete  
               >   
               View File  
               </Button>  
               </Box>
             </Card>
  
           </Grid>
         ))} 

       </Grid>
      </div>
    );
  
  }