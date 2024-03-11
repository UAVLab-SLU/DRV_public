import CardMedia from '@mui/material/CardMedia'
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
import Modal from '@mui/material/Modal';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';
import AlertTitle from '@mui/material/AlertTitle';
import { wait } from '@testing-library/user-event/dist/utils';
import PropTypes from 'prop-types'; 
import { Card, CardContent, CardHeader, Typography } from '@mui/material';   
import FuzzyDashboard from './components/FuzzyDashboard'; 
import React, { useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import Snackbar from '@mui/material/Snackbar';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; 
import CircularProgress from '@mui/material/CircularProgress'; 
import { Table, TableBody, TableCell, TableRow, TableColumn } from '@mui/material';  
import "./styles.css"



export default function LandingPage(parameter) { 


    return (
        <nav className= "nav">   
        <a href=" /" className = "site-title">  
            Drone World
        </a> 
        <ul>  
            <li>  
                <a href = "/">Create Simulation</a>  
                </li> 
                <li> 
                <a href = "/about">About Us</a>
            </li>
            </ul>
        </nav>
    );
}
