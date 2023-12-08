import React, { useEffect, useState } from 'react';
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
//import React from 'react';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';   
import FuzzyDashboard from './FuzzyDashboard'; 
//import ExpansionPanel from '@material-ui/core/ExpansionPanel';
// ReportDashboard.js
//import React from 'react';
//import { Card, CardHeader, CardContent } from '@material-ui/core';

//var filename="";  

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

  const navigate = useNavigate(); 
  const redirectToHome = () => {
    navigate('/')
  }
  const redirectToFuzzyDashboard = () => {
    navigate('/dashboard')
  }
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
  
    // Call fetchData once when the component mounts
    fetchData();
  }, []); 


  
  // {/* CODE FOR GETTING ENCODED FOLDERS*/}
  // const [folderContents, setFolderContents] = useState([]);
  // const [selectedFolderName, setSelectedFolderName] = useState(null);
  // const handleFolderSelect = (folderName) => {
  //   // Update the selected folder when a folder is selected
  //   setSelectedFolderName(folderName);
  // };
  // const handleButtonClick = async (folderName) => {
  //   handleFolderSelect(folderName);
  //   // Define the API endpoint
  //   const apiUrl = `http://localhost:5000/list-folder-contents-${selectedFolderName}`;


  //   // Make the API call using the fetch function
  //   fetch(apiUrl)
  //     .then(response => {
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! Status: ${response.status}`);
  //       }
  //       return response.json();
  //     })
  //     .then(data => {
  //         // Set the folder contents in the state
  //         setFolderContents(data);
  //         console.log('Folder Contents:', data);
  //         })
  //     .catch(error => {
  //       console.error('Error fetching data:', error);
  //     });
      
  // };

    return (
      <div className='dashboard'>
        <Box>
          <Typography variant="h4" style={{textAlign:'center', padding:'10px', fontWeight: 700}}>
            Acceptance Test Report
            <Tooltip title="Home" placement='bottom'><HomeIcon style={{float:'right', cursor:'pointer', fontSize:'35px'}} onClick={redirectToHome}/></Tooltip>
      
            <Container maxWidth="sm" style={{padding:'10px', alignContent:'center'}}>
              {/* <Paper variant="outlined" square style={{textAlign:'center', padding:'10px'}}> */}
              {/* <div>UPLOAD FILE CONTENTS</div><br/><br/> */}
            </Container>
            <Button variant="contained" color="primary" onClick={redirectToFuzzyDashboard} style={{ marginTop: '10px' }}>
            Go to Fuzzy Dashboard
            </Button>
          </Typography>
        </Box>
        <Grid container spacing={2}> 
            {reportFiles.map(file => (
              <Grid key={file.id} item xs={4}>
  
                  <Card key={file.filename} sx={{ maxWidth: 400, height: 270, border: file.contains_fuzzy ? '1px solid lightgreen' : 'none'}}>
                  <CardHeader title= {file.filename}/>
    
                  <CardContent>
    
                      <p>Drone Count: {file.drone_count}</p> 

                      {file.contains_fuzzy && (
                      <p>Fuzzy Testing: {file.contains_fuzzy.toString()}</p>
                      )}

                      {!file.contains_fuzzy && ( 
                    <p>Simulation Testing</p>
                      )}
                    
                    
                  </CardContent>  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '10px' }}> 
                      <Button 
                          variant="contained"  component = "label"
                          sx={{ minWidth: '120px', marginLeft: '230px', fontSize: '0.8rem' }}
                          onClick = {redirectToFuzzyDashboard} >
                          
                      View File 
                      </Button> 
                  </Box>
                  </Card>
  
              </Grid>
         ))} 
         
      </Grid>       
    </div>
    );}
