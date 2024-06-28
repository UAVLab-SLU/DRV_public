import { EnvironmentModel } from "./EnvironmentModel";
import { MonitorModel } from "./MonitorModel";


export class SimulationConfigurationModel {

    constructor(){
        this._environment = new EnvironmentModel();
        this._drones = new Array();
        this._monitors = new MonitorModel();
    }

    get environment(){
        return this._environment;
    }

    get monitors(){
        return this._monitors;
    }
    
    set environment(value){
        this._environment = value;
    }

    set monitors(value){
        this._monitors = value;
    }

    getDroneBasedOnIndex(index){
        if(this._drones.length > index){
            return this._drones[index];
        }
    }

    addNewDrone(droneObj){
        this._drones.push(droneObj);
    }
    
    generateJSON(){
        let data = {}
        data["environment"] = this._environment.toJSONString();
        data["drones"] = this._drones?.map( droneObj => droneObj.toJSONString() );
        data["monitors"] = this._monitors.toJSONString;
        return data;
    }


}