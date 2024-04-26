import React, { useEffect, useState } from 'react';
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
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia'
import Modal from '@mui/material/Modal';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';
import AlertTitle from '@mui/material/AlertTitle';
import { wait } from '@testing-library/user-event/dist/utils';
import Snackbar from '@mui/material/Snackbar';
import ClickAwayListener from '@mui/material/ClickAwayListener';

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

export default function FuzzyDashboard(parameter) {
  const navigate = useNavigate(); 
  const location = useLocation();
  const deviation = location.state != null ? location.state.mainJson.monitors != null ?  
      location.state.mainJson.monitors.circular_deviation_monitor != null ? location.state.mainJson.monitors.circular_deviation_monitor.param[0] : null : null : null
  const horizontal = location.state != null ? location.state.mainJson.monitors != null ?  
      location.state.mainJson.monitors.min_sep_dist_monitor != null ? location.state.mainJson.monitors.min_sep_dist_monitor.param[0] : null : null : null
  const lateral = location.state != null ? location.state.mainJson.monitors != null ?  
      location.state.mainJson.monitors.min_sep_dist_monitor != null ? location.state.mainJson.monitors.min_sep_dist_monitor.param[1] : null : null : null  
  const [fileArray, setFileArray] = React.useState([])
  const [CircularDeviationMonitor, setCircularDeviationMonitor] = React.useState([])
  const [CollisionMonitor, setCollisionMonitor] = React.useState([])
  const [LandspaceMonitor, setLandspaceMonitor] = React.useState([])
  const [UnorderedWaypointMonitor, setUnorderedWaypointMonitor] = React.useState([])
  const [OrderedWaypointMonitor, setOrderedWaypointMonitor] = React.useState([])
  const [PointDeviationMonitor, setPointDeviationMonitor] = React.useState([])
  const [MinSepDistMonitor, setMinSepDistMonitor] = React.useState([])
  const [NoFlyZoneMonitor, setNoFlyZoneMonitor] = React.useState([])
  const [open, setOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState();
  const [htmlLink, setHtmlLink] = React.useState();
  const [voilation, setVoilation] = React.useState(false)
  const [isFuzzyList, setIsFuzzyList] = React.useState(false);
  const [fuzzyTest, setFuzzyTest] = React.useState([]);

  const names = [{name:0},{name:5},{name:10}]

  const tempJson = {
    "CircularDeviationMonitor": [],
    "CollisionMonitor": [
        {
            "content": "INFO;14:46:50;Drone 2;CollisionMonitor started\nPASS;14:48:17;Drone 2;No collision detected\n",
            "failContent": {},
            "fuzzyPath": "CollisionMonitor",
            "fuzzyValue": "CollisionMonitor",
            "infoContent": {
                "Drone 2": "CollisionMonitor started"
            },
            "name": "Drone 2_log.txt",
            "passContent": {
                "Drone 2": "No collision detected"
            },
            "type": "text/plain"
        },
        {
            "content": "INFO;14:46:50;Drone 3;CollisionMonitor started\nPASS;14:48:17;Drone 3;No collision detected\n",
            "failContent": {},
            "fuzzyPath": "CollisionMonitor",
            "fuzzyValue": "CollisionMonitor",
            "infoContent": {
                "Drone 3": "CollisionMonitor started"
            },
            "name": "Drone 3_log.txt",
            "passContent": {
                "Drone 3": "No collision detected"
            },
            "type": "text/plain"
        },
        {
            "content": "INFO;14:46:50;Drone 1;CollisionMonitor started\nPASS;14:48:17;Drone 1;No collision detected\n",
            "failContent": {},
            "fuzzyPath": "CollisionMonitor",
            "fuzzyValue": "CollisionMonitor",
            "infoContent": {
                "Drone 1": "CollisionMonitor started"
            },
            "name": "Drone 1_log.txt",
            "passContent": {
                "Drone 1": "No collision detected"
            },
            "type": "text/plain"
        }
    ],
    "LandspaceMonitor": [
        {
            "content": "INFO;14:46:50;Drone 2;Landing space geolocation: [[1, 1], [2, 2]]\nINFO;14:46:50;Drone 2;Landing space cartesian location: [(9900145.925622167, -4561220.343661562, 0), (10011465.416415442, -4447884.4720193315, 0)]\nINFO;14:46:50;Drone 2;Landspace monitor started\nPASS;14:48:16;Drone 2;No landing violations detected\n",
            "failContent": {},
            "fuzzyPath": "LandspaceMonitor",
            "fuzzyValue": "LandspaceMonitor",
            "infoContent": {
                "Drone 2": "Landspace monitor started"
            },
            "name": "Drone 2_log.txt",
            "passContent": {
                "Drone 2": "No landing violations detected"
            },
            "type": "text/plain"
        },
        {
            "content": "INFO;14:46:50;Drone 3;Landing space geolocation: [[1, 1], [2, 2]]\nINFO;14:46:50;Drone 3;Landing space cartesian location: [(9900145.925622167, -4561220.343661562, 0), (10011465.416415442, -4447884.4720193315, 0)]\nINFO;14:46:50;Drone 3;Landspace monitor started\nPASS;14:48:16;Drone 3;No landing violations detected\n",
            "failContent": {},
            "fuzzyPath": "LandspaceMonitor",
            "fuzzyValue": "LandspaceMonitor",
            "infoContent": {
                "Drone 3": "Landspace monitor started"
            },
            "name": "Drone 3_log.txt",
            "passContent": {
                "Drone 3": "No landing violations detected"
            },
            "type": "text/plain"
        },
        {
            "content": "INFO;14:46:50;Drone 1;Landing space geolocation: [[1, 1], [2, 2]]\nINFO;14:46:50;Drone 1;Landing space cartesian location: [(9900145.925622167, -4561220.343661562, 0), (10011465.416415442, -4447884.4720193315, 0)]\nINFO;14:46:50;Drone 1;Landspace monitor started\nPASS;14:48:16;Drone 1;No landing violations detected\n",
            "failContent": {},
            "fuzzyPath": "LandspaceMonitor",
            "fuzzyValue": "LandspaceMonitor",
            "infoContent": {
                "Drone 1": "Landspace monitor started"
            },
            "name": "Drone 1_log.txt",
            "passContent": {
                "Drone 1": "No landing violations detected"
            },
            "type": "text/plain"
        }
    ],
    "MinSepDistMonitor": [
        {
            "content": "INFO;14:46:50;['Drone 1', 'Drone 2', 'Drone 3'];MinSepDistMonitor started, checking breach of lateral: 1 meters, horizontal : 1 meters, for every 1 seconds\nPASS;14:48:20;['Drone 1', 'Drone 2', 'Drone 3'];The minimum separation distance was not breached\n",
            "failContent": {},
            "fuzzyPath": "MinSepDistMonitor",
            "fuzzyValue": "MinSepDistMonitor",
            "infoContent": {
                "['Drone 1', 'Drone 2', 'Drone 3']": "MinSepDistMonitor started, checking breach of lateral: 1 meters, horizontal : 1 meters, for every 1 seconds"
            },
            "name": "log.txt",
            "passContent": {
                "['Drone 1', 'Drone 2', 'Drone 3']": "The minimum separation distance was not breached"
            },
            "type": "text/plain"
        }
    ],
    "NoFlyZoneMonitor": [],
    "OrderedWaypointMonitor": [],
    "PointDeviationMonitor": [
        {
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "name": "Drone 1_interactive.html",
            "path": "/Users/kaleb/Documents/AirSim/report/2023-11-16-14-46-44_Batch_3/FlyToPoints/PointDeviationMonitor/Drone 1_interactive.html",
            "type": "text/html"
        },
        {
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "imgContent": null,
            "name": "Drone 3_plot.png",
            "path": "/Users/kaleb/Documents/AirSim/report/2023-11-16-14-46-44_Batch_3/FlyToPoints/PointDeviationMonitor/Drone 3_interactive.html",
            "type": "image/png"
        },
        {
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "imgContent": null,
            "name": "Drone 2_plot.png",
            "path": "/Users/kaleb/Documents/AirSim/report/2023-11-16-14-46-44_Batch_3/FlyToPoints/PointDeviationMonitor/Drone 2_interactive.html",
            "type": "image/png"
        },
        {
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "name": "Drone 3_interactive.html",
            "path": "/Users/kaleb/Documents/AirSim/report/2023-11-16-14-46-44_Batch_3/FlyToPoints/PointDeviationMonitor/Drone 3_interactive.html",
            "type": "text/html"
        },
        {
            "content": "INFO;14:46:50;Drone 2;speed 4 m/s with wind 45.0 degrees clock wise from north, speed 1.0 m/s\nINFO;14:46:50;Drone 2;Register drone location every 0.02 seconds\nINFO;14:48:16;Drone 2;Mission task finished\nPASS;14:48:16;Drone 2;No deviation violation (<15 meters)\n",
            "failContent": {},
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "infoContent": {
                "Drone 2": "Mission task finished"
            },
            "name": "Drone 2_log.txt",
            "passContent": {
                "Drone 2": "No deviation violation (<15 meters)"
            },
            "type": "text/plain"
        },
        {
            "content": "INFO;14:46:50;Drone 3;speed 4 m/s with wind 45.0 degrees clock wise from north, speed 1.0 m/s\nINFO;14:46:50;Drone 3;Register drone location every 0.02 seconds\nINFO;14:48:16;Drone 3;Mission task finished\nPASS;14:48:16;Drone 3;No deviation violation (<15 meters)\n",
            "failContent": {},
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "infoContent": {
                "Drone 3": "Mission task finished"
            },
            "name": "Drone 3_log.txt",
            "passContent": {
                "Drone 3": "No deviation violation (<15 meters)"
            },
            "type": "text/plain"
        },
        {
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "name": "Drone 2_interactive.html",
            "path": "/Users/kaleb/Documents/AirSim/report/2023-11-16-14-46-44_Batch_3/FlyToPoints/PointDeviationMonitor/Drone 2_interactive.html",
            "type": "text/html"
        },
        {
            "content": "INFO;14:46:50;Drone 1;speed 4 m/s with wind 45.0 degrees clock wise from north, speed 1.0 m/s\nINFO;14:46:50;Drone 1;Register drone location every 0.02 seconds\nINFO;14:48:16;Drone 1;Mission task finished\nPASS;14:48:16;Drone 1;No deviation violation (<15 meters)\n",
            "failContent": {},
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "infoContent": {
                "Drone 1": "Mission task finished"
            },
            "name": "Drone 1_log.txt",
            "passContent": {
                "Drone 1": "No deviation violation (<15 meters)"
            },
            "type": "text/plain"
        },
        {
            "fuzzyPath": "PointDeviationMonitor",
            "fuzzyValue": "PointDeviationMonitor",
            "imgContent": null,
            "name": "Drone 1_plot.png",
            "path": "/Users/kaleb/Documents/AirSim/report/2023-11-16-14-46-44_Batch_3/FlyToPoints/PointDeviationMonitor/Drone 1_interactive.html",
            "type": "image/png"
        }
    ],
    "UnorderedWaypointMonitor": [],
    "name": 0
  }


  const handleOpen = (img) => {
    setOpen(true);
    setSelectedImage(img.imgContent)
    setHtmlLink(img.path)
  }
  const handleClose = (e, name) => {
      setOpen(false)
  };

  const redirectToHome = () => {
    navigate('/')
  }
  
  const getInfoContents = (fileContents, keyMatch, droneMap) => {
    const content_array = fileContents.split("\n");
    let infoContent = [];
    content_array.map(content => {
      let content_split = content.split(";");
      if(content.includes(keyMatch) && content_split.length == 4) {
        if(keyMatch == "FAIL") {
          setVoilation(true)
        }
        if(droneMap.get(content_split[2]) == null) {
          droneMap.set(content_split[2], [content_split[3]])
        } else {
          let val = []
          val = droneMap.get(content_split[2])
          val = val.concat([content_split[3]])
          droneMap.set(content_split[2], val)
        }
        
        infoContent.push(content_split[2] + ": " + content_split[3])
      }
    })
    return droneMap;
  }
  const returnContentsItem = (colorCode, keyValue, info, icon, fuzzyValue, severity_val) => {
    for (const mapKey of info.keys()) {
      console.log(mapKey);
      console.log(info.get(mapKey))
      let fuzzyValueArray = fuzzyValue.split("_")
      return (
      <React.Fragment>
        <Grid container spacing={2} direction="row" style={{fontFamily:"sans-serif"}}>
          <h4>{mapKey}</h4>&nbsp;&nbsp;
          {/* <h5>( Fuzzed Parameter : Wind Velocity = {fuzzyValueArray[2]} meters/s)</h5> */}
          </Grid>
        {info.get(mapKey).map((val, id) => {
        return (
          <React.Fragment key={keyValue} >
          {/* <List sx={{ width: '100%', bgcolor: 'background.paper', position:'relative' }} key={keyValue}> */}
          <List key={keyValue}>
            <ListItem>
              <Alert variant="filled" severity={severity_val} style={{width:'100%'}}>
              {/* <AlertTitle>{mapKey} <span>&nbsp;&nbsp; Fuzzed Parameter : Wind Velocity = {fuzzyValueArray[2]} meters/second</span></AlertTitle> */}
              <ListItemText primary={val} >
              </ListItemText>
                </Alert>
            </ListItem>
           
          </List>
          
          </React.Fragment>
        )
      })}
      </React.Fragment>)
    }
  }
  const handleDirectorySelectFuzzy = () => {
    wait(1000);
    console.log('fuzztTestNames----- in handleDirectorySelectFuzzy', names)
  
    setFuzzyTest([]);
    names.map(id=> {
      let unordered=[];
      let circular = [];
    let collision = [];
    let landscape = [];
    let orderWay = [];
    let pointDev = [];
    let minSep = [];
    let nonFly = [];
      UnorderedWaypointMonitor.map(unorder => {
        console.log('UnorderedWaypointMonitor---', UnorderedWaypointMonitor)
        console.log('un  unorder.fuzzyValue', unorder.fuzzyValue)
        if(id.name == unorder.fuzzyValue) {
          console.log('inside unod')
          unordered.push(unorder)
        }
        console.log('unordered----', unordered)
      })
      CircularDeviationMonitor.map(circularDev => {
        if(id.name == circularDev.fuzzyValue) {
          circular.push(circularDev);
        }
      })
      CollisionMonitor.map(coll => {
        console.log('CollisionMonitor---', CollisionMonitor)
        if(id.name == coll.fuzzyValue) {
          collision.push(coll);
        }
      })
      LandspaceMonitor.map(land => {
        if(id.name == land.fuzzyValue) {
          landscape.push(land);
        }
      })
      OrderedWaypointMonitor.map( order => {
        if(id.name == order.fuzzyValue) {
          orderWay.push(order);
        }
      })
      PointDeviationMonitor.map(point => {
        if(id.name == point.fuzzyValue) {
          pointDev.push(point);
        }
      })
      MinSepDistMonitor.map(min => {
        if(id.name == min.fuzzyValue) {
          minSep.push(min);
        }
      })
      NoFlyZoneMonitor.map(zone => {
        if(id.name == zone.fuzzyVale) {
          nonFly.push(zone)
        }
      })
      setFuzzyTest(prevState => [
        ...prevState,
        {
            "name":id.name,
            "UnorderedWaypointMonitor": unordered,
            "CircularDeviationMonitor": circular,
            "CollisionMonitor" : collision,
            "LandspaceMonitor": landscape,
            "OrderedWaypointMonitor": orderWay,
            "PointDeviationMonitor": pointDev,
            "MinSepDistMonitor": minSep,
            "NoFlyZoneMonitor":nonFly
        }
      ])
    })
  }

  useEffect(() => {
    handleDirectorySelectFuzzy()
  }, 
  [UnorderedWaypointMonitor, CollisionMonitor, CircularDeviationMonitor, LandspaceMonitor, OrderedWaypointMonitor, PointDeviationMonitor, MinSepDistMonitor]
  )

  const dictOfFunctions = {
    "UnorderedWaypointMonitor": setUnorderedWaypointMonitor,
    "CircularDeviationMonitor": setCircularDeviationMonitor,
    "CollisionMonitor": setCollisionMonitor,
    "LandspaceMonitor": setLandspaceMonitor,
    "OrderedWaypointMonitor": setOrderedWaypointMonitor,
    "PointDeviationMonitor": setPointDeviationMonitor,
    "MinSepDistMonitor": setMinSepDistMonitor,
    "NoFlyZoneMonitor": setNoFlyZoneMonitor
  }
    
  //React.useEffect(() => {}, [fileArray])
  const handleDirectorySelect = () => {
    const jsonFile = tempJson;
    //const files = event.target.files;
    let name = [];
    // Iterate through all the keys in the json file
    for (let key in jsonFile) {
      console.log('key----', key)
      if ( (jsonFile[key] !== undefined)){
        console.log('jsonFile[key]---', jsonFile[key])

        //Iterate throguh all the subkeys in the json file
        for (let i = 0; i < jsonFile[key].length; i++) {
          if(jsonFile[key][i].type === 'text/plain'){
            dictOfFunctions[key](prevState => [...prevState, {
                            name:jsonFile[key][i].name,
                            type:jsonFile[key][i].type,
                            content:jsonFile[key][i].content,
                            infoContent:getInfoContents(jsonFile[key][i].content, "INFO", new Map()),
                            passContent:getInfoContents(jsonFile[key][i].content, "PASS", new Map()),
                            failContent:getInfoContents(jsonFile[key][i].content, "FAIL", new Map()),
                            fuzzyPath:jsonFile[key][i].fuzzyPath,
                            fuzzyValue: jsonFile[key][i].fuzzyValue
                            }
                        ])
          }
          else if (jsonFile[key][i].type === "image/png") {
            dictOfFunctions[key](prevState => [...prevState,
                          {
                            name:jsonFile[key][i].name,
                            type:jsonFile[key][0].type,
                            imgContent:null,
                            path:jsonFile[key][0].path,
                            fuzzyValue: jsonFile[key][0].fuzzyValue
                          }
          ])
          }
        }
    }
    else if (jsonFile[key].length === 0){
      dictOfFunctions[key]([])
    }
  }
  
    console.log("Json file", jsonFile)
    console.log("UnorderedWaypointMonitor", UnorderedWaypointMonitor)
    console.log("CollisionMonitor", CollisionMonitor)
    console.log("CircularDeviationMonitor", CircularDeviationMonitor)
    console.log("LandspaceMonitor", LandspaceMonitor)
    console.log("OrderedWaypointMonitor", OrderedWaypointMonitor)
    console.log("PointDeviationMonitor", PointDeviationMonitor)
    console.log("MinSepDistMonitor", MinSepDistMonitor)
    console.log("NoFlyZoneMonitor", NoFlyZoneMonitor)  
  };
  React.useEffect(() => {
    handleDirectorySelect();
  }, [])
      //for (let i = 0; i < files.length; i++) {
      // const fileReader = new FileReader();
      // const file = files[i];
      // console.log('file----', file)
      // const data = [...fileArray]
      // let path = file.webkitRelativePath
      // let fuzzyPathValue = null
      // let paths = path.split("/")
      // console.log('paths----', paths)
      // if(paths.length > 1) {
      //   fuzzyPathValue = paths[1]
      //   setIsFuzzyList(fuzzyPathValue.includes('Fuzzy')? true : false);
      // }
      // let fuzzyValueArray = fuzzyPathValue.split("_")
      // let exist = false
      // name.map(testName => {
      //   if(testName.name == fuzzyValueArray[2]) {
      //     exist = true;
      //   }
      // }) 
      // if(!exist) {
      //   name.push({name:fuzzyValueArray[2]})
      // }
  //     }
  //     console.log('fuzzyPathValue---', fuzzyPathValue)
  //     if (file.type === 'text/plain') {
  //       fileReader.onload = () => {
  //         const fileContents = fileReader.result;
  //         if(file.webkitRelativePath.includes("UnorderedWaypointMonitor")) {
  //           setUnorderedWaypointMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               content:fileContents,
  //               infoContent:getInfoContents(fileContents, "INFO", new Map()),
  //               passContent:getInfoContents(fileContents, "PASS", new Map()),
  //               failContent:getInfoContents(fileContents, "FAIL", new Map()),
  //               fuzzyPath:fuzzyPathValue,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("CircularDeviationMonitor")) {
  //           let info = getInfoContents(fileContents);
  //           console.log('info----', info)
  //           setCircularDeviationMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               content:fileContents,
  //               infoContent:getInfoContents(fileContents, "INFO", new Map()),
  //               passContent:getInfoContents(fileContents, "PASS", new Map()),
  //               failContent:getInfoContents(fileContents, "FAIL", new Map()),
  //               fuzzyPath:fuzzyPathValue,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("CollisionMonitor")) {
  //           setCollisionMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               content:fileContents,
  //               infoContent:getInfoContents(fileContents, "INFO", new Map()),
  //               passContent:getInfoContents(fileContents, "PASS", new Map()),
  //               failContent:getInfoContents(fileContents, "FAIL", new Map()),
  //               fuzzyPath:fuzzyPathValue,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("LandspaceMonitor")) {
  //           setLandspaceMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               content:fileContents,
  //               infoContent:getInfoContents(fileContents, "INFO", new Map()),
  //               passContent:getInfoContents(fileContents, "PASS", new Map()),
  //               failContent:getInfoContents(fileContents, "FAIL", new Map()),
  //               fuzzyPath:fuzzyPathValue,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("OrderedWaypointMonitor")) {
  //           setOrderedWaypointMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               content:fileContents,
  //               infoContent:getInfoContents(fileContents, "INFO", new Map()),
  //               passContent:getInfoContents(fileContents, "PASS", new Map()),
  //               failContent:getInfoContents(fileContents, "FAIL", new Map()),
  //               fuzzyPath:fuzzyPathValue,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("PointDeviationMonitor")) {
  //           setPointDeviationMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               content:fileContents,
  //               infoContent:getInfoContents(fileContents, "INFO", new Map()),
  //               passContent:getInfoContents(fileContents, "PASS", new Map()),
  //               failContent:getInfoContents(fileContents, "FAIL", new Map()),
  //               fuzzyPath:fuzzyPathValue,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("MinSepDistMonitor")) {
  //           setMinSepDistMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               content:fileContents,
  //               infoContent:getInfoContents(fileContents, "INFO", new Map()),
  //               passContent:getInfoContents(fileContents, "PASS", new Map()),
  //               failContent:getInfoContents(fileContents, "FAIL", new Map()),
  //               fuzzyPath:fuzzyPathValue,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("NoFlyZoneMonitor")) {
  //           setNoFlyZoneMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               content:fileContents,
  //               infoContent:getInfoContents(fileContents, "INFO", new Map()),
  //               passContent:getInfoContents(fileContents, "PASS", new Map()),
  //               failContent:getInfoContents(fileContents, "FAIL", new Map()),
  //               fuzzyPath:fuzzyPathValue,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
          
  //       };
  //       fileReader.readAsText(file);
  //     } else if (file.type === 'image/png') {
  //       console.log("its image")
  //       fileReader.onload = () => {
  //         const fileContents = fileReader.result;
  //         if(file.webkitRelativePath.includes("UnorderedWaypointMonitor")) {
  //           let htmlfile = file.webkitRelativePath.replace("_plot.png", "_interactive.html")
  //           setUnorderedWaypointMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               imgContent:URL.createObjectURL(file),
  //               path:htmlfile,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("CircularDeviationMonitor")) {
  //           let htmlfile = file.webkitRelativePath.replace("_plot.png", "_interactive.html")
  //           setCircularDeviationMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               imgContent:URL.createObjectURL(file),
  //               path:htmlfile,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("CollisionMonitor")) {
  //           let htmlfile = file.webkitRelativePath.replace("_plot.png", "_interactive.html")
  //           setCollisionMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               imgContent:URL.createObjectURL(file),
  //               path:htmlfile,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("LandspaceMonitor")) {
  //           let htmlfile = file.webkitRelativePath.replace("_plot.png", "_interactive.html")
  //           setLandspaceMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               imgContent:URL.createObjectURL(file),
  //               path:htmlfile,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("OrderedWaypointMonitor")) {
  //           let htmlfile = file.webkitRelativePath.replace("_plot.png", "_interactive.html")
  //           setOrderedWaypointMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               imgContent:URL.createObjectURL(file),
  //               path:htmlfile,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("PointDeviationMonitor")) {
  //           let htmlfile = file.webkitRelativePath.replace("_plot.png", "_interactive.html")
  //           setPointDeviationMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               imgContent:URL.createObjectURL(file),
  //               path:htmlfile,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("MinSepDistMonitor")) {
  //           let htmlfile = file.webkitRelativePath.replace("_plot.png", "_interactive.html")
  //           setMinSepDistMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               imgContent:URL.createObjectURL(file),
  //               path:htmlfile,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //         if(file.webkitRelativePath.includes("NoFlyZoneMonitor")) {
  //           let htmlfile = file.webkitRelativePath.replace("_plot.png", "_interactive.html")
  //           setNoFlyZoneMonitor(prevState => [
  //             ...prevState,
  //             {
  //               name:file.name,
  //               type:file.type,
  //               imgContent:URL.createObjectURL(file),
  //               path:htmlfile,
  //               fuzzyValue: fuzzyValueArray[2]
  //             }
  //           ])
  //         }
  //       }
  //       fileReader.readAsText(file);
  //     } else if (file.type === '') {
  //       const directoryReader = new FileReader();
  //       directoryReader.onload = () => {
  //         handleDirectorySelect({target: {files: directoryReader.result}});
  //       };
  //       directoryReader.readAsArrayBuffer(file);
  //     }
  //   }
  //   // setTestNames([name]);
  //   console.log('name----', name)
  //   // handleDirectorySelectFuzzy(name);
  // }
  const [folderDirectories, setFolderDirectories] = useState([]);
  const componenet = () => {
    const handleDirectorySelect = (selectedFiles) => {
    console.log('Selected Files:', selectedFiles);
  }
  
  };


  const [snackBarState, setSnackBarState] = React.useState({
    open: false,
  });

  const handleSnackBarVisibility = (val) => {
    setSnackBarState(prevState => ({
      ...prevState,
      open: val
    }))
  }
  const handleClickAway = () => {
    // Prevent closing when clicking outside the box
    handleSnackBarVisibility(true);
  };
  useEffect(() => {
    // Trigger the Snackbar to be open when the component mounts
    handleSnackBarVisibility(true);
  }, []);
  return (
    <div>
    <Snackbar
      open={snackBarState.open}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={60000}
      onClose={() => handleSnackBarVisibility(false)}
    >
      <Alert
        onClose={() => handleSnackBarVisibility(false)}
        severity="info"
        sx={{ maxHeight: '150px', maxWidth: '40%' }}
      >
        {"Enhancements to the view test report details are in progress! As we are implementing new features, please use the “SELECT SIMULATION DATA DIRECTORY” button to select the files you wish to upload. These files should be located within the ‘Airsim’ folder under your Documents folder on your local machine. You can either upload the entire ‘reports’ folder to access all results or choose specific folders for each test you want to upload."}
      </Alert>
    </Snackbar>
      <Box>
      <Typography variant="h4" style={{textAlign:'center', padding:'10px', fontWeight: 700}}>
        Acceptance Test Report
        <Tooltip title="Home" placement='bottom'><HomeIcon style={{float:'right', cursor:'pointer', fontSize:'35px'}} onClick={redirectToHome}/></Tooltip>
      
        <Container maxWidth="sm" style={{padding:'10px', alignContent:'center'}}>
        {/* <Paper variant="outlined" square style={{textAlign:'center', padding:'10px'}}> */}
        {/* <div>UPLOAD FILE CONTENTS</div><br/><br/> */}
        <Button variant="contained" component="label" onClick = {handleDirectorySelect()}>
        Select Simulation Data Directory
        </Button>
      </Container>
      </Typography>
      </Box>
      {voilation ? <Alert severity="warning">
                        <AlertTitle>Warning</AlertTitle>
                        <strong>Violation Detected</strong>
                    </Alert>  : null}
      
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>{isFuzzyList == true ? <React.Fragment>
        {fuzzyTest.length > 0 ? 
          <React.Fragment>
            {fuzzyTest.map(function(fuzzy, id){
              return (
                <Paper key={id} elevation={3} style={{margin:'25px', padding:20}}>
                  <Typography variant="h6" component="h2">
                    <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Fuzzed Parameter : Wind Velocity = {fuzzy.name} meters/s</div>
                  </Typography>
                  <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {CollisionMonitor.length > 0 ?<Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
            <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test: Drones shall avoid collisions with other drones and the environment</div>
          </Typography>
          <ul>
          {fuzzy.CollisionMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
               
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath, 'success'))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath, 'error'))}
                
               </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {fuzzy.CollisionMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null}
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {fuzzy.LandspaceMonitor.length > 0 ? <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test: Drone shall always land at safe locations</div>
          </Typography>
          <ul>
          {fuzzy.LandspaceMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error"))}
                
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {fuzzy.LandspaceMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>

                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null}
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {fuzzy.UnorderedWaypointMonitor.length > 0 ? <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test: Drones shall reach all waypoints in the mission</div>
          </Typography>
          <ul>
          {fuzzy.UnorderedWaypointMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {/* {file.infoContent.map((info, i) => { */}
                  {/* {(returnContentsItem('blue', index, file.infoContent, <InfoIcon/>))} */}
                {/* })} */}
                { (returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {/* {file.failContent.map((info, i) => { */}
                  {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error")) }
                {/* })} */}
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
         <Grid container spacing={2} direction="row" >
          {fuzzy.UnorderedWaypointMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
               <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
               <Card sx={{ maxWidth: 500 }} variant="outlined">
                 {/* <img src={file.imgContent} width="30%"/> */}
                 <CardMedia
                   component="img"
                   image={file.imgContent}/>
               </Card></Grid> }
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper>: null}
          {/* {fuzzy.OrderedWaypointMonitor.length > 0 ? <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test: Drones must reach all their waypoints in  order</div>
          </Typography>
          <ul> */}
          {/* {fuzzy.OrderedWaypointMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>))}
                
                </React.Fragment>:null
            )
          })} */}
          {/* {fuzzy.OrderedWaypointMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null : <img src={file.imgContent} width="30%"/>}
              </React.Fragment>
            )
          })}
          </ul>
          </Paper> : null} */}
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {fuzzy.PointDeviationMonitor.length > 0 ? <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test : A drone should not deviate more than {deviation != null ? deviation : 'X'} meters from its planned flight path</div>
          </Typography>
          <ul>
          {fuzzy.PointDeviationMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath, 'success'))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath, 'error'))}
                
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {fuzzy.PointDeviationMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                  <Card sx={{ maxWidth: 500 }} variant="outlined">
                    {/* <img src={file.imgContent} width="30%"/> */}
                    <CardMedia
                      component="img"
                      image={file.imgContent}/>
                  </Card>
                  </Grid>
                }
              </React.Fragment>
            )
          })}</Grid>
          </ul>

          <ul>
          {fuzzy.CircularDeviationMonitor.map(function(file, index) {
            return ( file.type=== 'text/plain' ? 
              <React.Fragment key={index}>
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error"))}
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment> : null
            ) 
          })}
          <Grid container spacing={2} direction="row" >
          {fuzzy.CircularDeviationMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null }

          {/* </Paper> */}
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {fuzzy.MinSepDistMonitor.length > 0 ?  <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          {/*<div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test : Drones shall always maintain the lateral distance of {lateral != null ? lateral : 'X'} meters and separation distance of {horizontal != null ? horizontal : 'Y'} meters</div>*/}
            <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test : Drones shall always maintain the separation distance of {horizontal != null ? horizontal : 'Y'} meters</div>
          </Typography>
          <ul>
          {fuzzy.MinSepDistMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {/* {file.infoContent.map((info, i) => {
                  return (returnContentsItem('blue', i, info, <InfoIcon/>))
                })} */}
                {/* {file.passContent.map((info, i) => {
                  return (returnContentsItem('darkgreen', i, info, <CheckIcon />))
                })}
                {file.failContent.map((info, i) => {
                  return (returnContentsItem('darkred', i, info, <ClearIcon/>))
                })} */}
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error"))}
                
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {fuzzy.MinSepDistMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null}
          {fuzzy.NoFlyZoneMonitor.length > 0 ?  <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test : Drones entered in specified fly zones </div>
          </Typography>
          <ul>
          {fuzzy.NoFlyZoneMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error"))}    
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {fuzzy.NoFlyZoneMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null}
      </Box>
                </Paper>
              )
            })}
          </React.Fragment>:null} </React.Fragment>: 
          <React.Fragment>
            <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {CollisionMonitor.length > 0 ?<Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
            <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test: Drones shall avoid collisions with other drones and the environment</div>
          </Typography>
          <ul>
          {CollisionMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {/* {file.infoContent.map((info, i) => {
                  return (returnContentsItem('blue', i, info, <InfoIcon/>))
                })} */}
                {/* {file.passContent.map((info, i) => {
                  return (returnContentsItem('darkgreen', i, info, <CheckIcon />))
                })}
                {file.failContent.map((info, i) => {
                  return (returnContentsItem('darkred', i, info, <ClearIcon/>))
                })} */}
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath, 'success'))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath, 'error'))}
                
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {CollisionMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null}
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {LandspaceMonitor.length > 0 ? <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test: Drone shall always land at safe locations</div>
          </Typography>
          <ul>
          {LandspaceMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {/* {file.infoContent.map((info, i) => {
                  return (returnContentsItem('blue', i, info, <InfoIcon/>))
                })} */}
                {/* {file.passContent.map((info, i) => {
                  return (returnContentsItem('darkgreen', i, info, <CheckIcon />))
                })}
                {file.failContent.map((info, i) => {
                  return (returnContentsItem('darkred', i, info, <ClearIcon/>))
                })} */}
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error"))}
                
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {LandspaceMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>

                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null}
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {UnorderedWaypointMonitor.length > 0 ? <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test: Drones shall reach all waypoints in the mission</div>
          </Typography>
          <ul>
          {UnorderedWaypointMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {/* {file.infoContent.map((info, i) => { */}
                  {/* {(returnContentsItem('blue', index, file.infoContent, <InfoIcon/>))} */}
                {/* })} */}
                { (returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {/* {file.failContent.map((info, i) => { */}
                  {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error")) }
                {/* })} */}
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
         <Grid container spacing={2} direction="row" >
          {UnorderedWaypointMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
               <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
               <Card sx={{ maxWidth: 500 }} variant="outlined">
                 {/* <img src={file.imgContent} width="30%"/> */}
                 <CardMedia
                   component="img"
                   image={file.imgContent}/>
               </Card></Grid> }
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper>: null}
          {/* {OrderedWaypointMonitor.length > 0 ? <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test: Drones must reach all their waypoints in  order</div>
          </Typography>
          <ul> */}
          {/* {OrderedWaypointMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>))}
                
                </React.Fragment>:null
            )
          })} */}
          {/* {OrderedWaypointMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null : <img src={file.imgContent} width="30%"/>}
              </React.Fragment>
            )
          })}
          </ul>
          </Paper> : null} */}
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {PointDeviationMonitor.length > 0 ? <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test : A drone should not deviate more than {deviation != null ? deviation : 'X'} meters from its planned flight path</div>
          </Typography>
          <ul>
          {PointDeviationMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {/* {file.infoContent.map((info, i) => {
                  return (returnContentsItem('blue', i, info, <InfoIcon/>))
                })} */}
                {/* {file.passContent.map((info, i) => {
                  return (returnContentsItem('darkgreen', i, info, <CheckIcon />))
                })}
                {file.failContent.map((info, i) => {
                  return (returnContentsItem('darkred', i, info, <ClearIcon/>))
                })} */}
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath, 'success'))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath, 'error'))}
                
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {PointDeviationMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                  <Card sx={{ maxWidth: 500 }} variant="outlined">
                    {/* <img src={file.imgContent} width="30%"/> */}
                    <CardMedia
                      component="img"
                      image={file.imgContent}/>
                  </Card>
                  </Grid>
                }
              </React.Fragment>
            )
          })}</Grid>
          </ul>

          {/* <Paper elevation={3} style={{margin:'25px', padding:20}}> */}
          {/* <Typography variant="h5" component="h2">
          Circular Deviation Monitor
          </Typography> */}
          <ul>
          {CircularDeviationMonitor.map(function(file, index) {
            return ( file.type=== 'text/plain' ? 
              <React.Fragment key={index}>
                {/* {file.infoContent.map((info, i) => {
                  return (returnContentsItem('blue', i, info, <InfoIcon/>))
                })} */}
                {/* {file.passContent.map((info, i) => {
                  return (returnContentsItem('darkgreen', i, file.passContent, <CheckIcon />))
                })} */}
                {/* {file.failContent.map((info, i) => {
                  return (returnContentsItem('darkred', i, file.failContent, <ClearIcon/>))
                })} */}
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error"))}
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment> : null
            ) 
          })}
          <Grid container spacing={2} direction="row" >
          {CircularDeviationMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null }

          {/* </Paper> */}
      </Box>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
          width: "100%",
          height: "100%",
        },
      }}>
        {MinSepDistMonitor.length > 0 ?  <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          {/*<div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test : Drones shall always maintain the lateral distance of {lateral != null ? lateral : 'X'} meters and separation distance of {horizontal != null ? horizontal : 'Y'} meters</div>*/}
            <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test : Drones shall always maintain the separation distance of {horizontal != null ? horizontal : 'Y'} meters</div>
          </Typography>
          <ul>
          {MinSepDistMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {/* {file.infoContent.map((info, i) => {
                  return (returnContentsItem('blue', i, info, <InfoIcon/>))
                })} */}
                {/* {file.passContent.map((info, i) => {
                  return (returnContentsItem('darkgreen', i, info, <CheckIcon />))
                })}
                {file.failContent.map((info, i) => {
                  return (returnContentsItem('darkred', i, info, <ClearIcon/>))
                })} */}
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error"))}
                
                {/* {file.type === 'text/plain' ?  <ListItem ><AdjustIcon/><ListItemText primary={file.content} /></ListItem> : null} */}
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {MinSepDistMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null}
          {NoFlyZoneMonitor.length > 0 ?  <Paper elevation={3} style={{margin:'25px', padding:20}}>
          <Typography variant="h5" component="h2">
          <div style={{fontFamily: 'sans-serif', fontWeight: 700}}>Acceptance Test : Drones entered in specified fly zones </div>
          </Typography>
          <ul>
          {NoFlyZoneMonitor.map(function(file, index) {
            return (file.type=== 'text/plain' ?
              <React.Fragment key={index}>
                {(returnContentsItem('darkgreen', index, file.passContent, <CheckIcon />, file.fuzzyPath,"success"))}
                {(returnContentsItem('darkred', index, file.failContent, <ClearIcon/>, file.fuzzyPath,"error"))}    
              </React.Fragment>:null
            )
          })}
          <Grid container spacing={2} direction="row" >
          {NoFlyZoneMonitor.map(function(file, index) {
            return (
              <React.Fragment key={index}>
                {file.type === 'text/plain' ?  null :  
                <Grid item xs={4} style={{cursor:'pointer'}} onClick={() => handleOpen(file)}>
                <Card sx={{ maxWidth: 500 }} variant="outlined">
                  {/* <img src={file.imgContent} width="30%"/> */}
                  <CardMedia
                    component="img"
                    image={file.imgContent}/>
                </Card></Grid>}
              </React.Fragment>
            )
          })}</Grid>
          </ul>
          </Paper> : null}
      </Box>
          </React.Fragment> }
      </Box>
      
      {/* end of fuzzy  */}
        <div>
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <img src={selectedImage} width="100%" />
                {/* <a href={htmlLink}>Redirect to Html page</a> */}
            </Box>
        </Modal>
      </div>
    </div>
  );
}