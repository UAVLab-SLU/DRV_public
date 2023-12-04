import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import { Card, CardContent } from '@mui/material';
import PropTypes from 'prop-types'; 
import FuzzyDashboard from './FuzzyDashboard';


export default function FileCard({ name, type }) {

    return (
      <Card style={{ margin: '10px', padding: '10px' }}>
        <CardContent>
          <Typography variant="h6">
            {name}
          </Typography>
  
          <Typography variant="body2">
            {type} 
          </Typography>
        </CardContent>
      </Card>
    );
  
  } 
  //export default FileCard;
  
  FileCard.propTypes = { 
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
  };