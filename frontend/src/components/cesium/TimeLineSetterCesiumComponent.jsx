import React, { useRef, useEffect, useState } from 'react';
import { Entity } from 'resium';
import {
    Cartesian3,
    Math as CesiumMath,
    Cartographic,
    Cartesian2,
    JulianDate
} from 'cesium';
import PropTypes from 'prop-types';
import { useMainJson } from '../../model/MainJsonContext';
import { SimulationConfigurationModel } from '../../model/SimulationConfigurationModel';
import dayjs from 'dayjs';
import { EnvironmentModel } from '../../model/EnvironmentModel';

const TimeLineSetterCesiumComponent = ({ viewerReady, viewerRef }) => {

    const { envJson, setEnvJson, viewerMaintainer } = useMainJson();

    useEffect(() => {

        if (viewerReady) {
            const viewer = viewerRef.current.cesiumElement;
            const canvas = viewer.canvas;

            if (viewerMaintainer.current) {
              viewer.animation.viewModel.timeFormatter = function (date, viewModel) {

                if(viewerMaintainer.current){
                  date = JulianDate.fromDate(new Date(envJson.time));
                }

                const jsDate = JulianDate.toDate(date);

                viewer.clock.currentTime = date;

                // Get time components (hours, minutes, seconds)
                const hours = jsDate.getHours();
                const minutes = jsDate.getMinutes();
                const seconds = jsDate.getSeconds();

                // set the main JSON
                envJson.TimeOfDay = `${hours}:${minutes}:${seconds}`;
                envJson.time = dayjs(new Date(date));
                setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));

                // Get the timezone offset in minutes and convert to hours
                const timezoneOffsetHours = -(jsDate.getTimezoneOffset() / 60);

                // Format the time with timezone information
                const formattedTime = `${hours}:${minutes}:${seconds} UTC${timezoneOffsetHours >= 0 ? '+' : ''}${timezoneOffsetHours}`;
                
                return formattedTime;
              };
              viewerMaintainer.current = false;
            }
        }
    }, [viewerReady, envJson])

    return (
        <>
        </>
    )
}

TimeLineSetterCesiumComponent.propTypes = {
    viewerReady: PropTypes.bool.isRequired,
    viewerRef: PropTypes.object.isRequired,
};

export default TimeLineSetterCesiumComponent;