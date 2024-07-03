

export class DroneModel {

    constructor() {
        this._id = 0;
        this._droneName = "";
        this._FlightController = "";
        this._droneType = "";
        this._droneModel = "";
        this._VehicleType = "";
        this._DefaultVehicleState = "";
        this._EnableCollisionPassthrogh = false;
        this._EnableCollisions = false;
        this._AllowAPIAlways = false;
        this._EnableTrace = false;
        this._Name = "";
        this._image = "";
        this._color = "";
        this._X = 0;
        this._Y = 0;
        this._Z = 0;
        this._Pitch = 0;
        this._Roll = 0;
        this._Yaw = 0;
        this._Sensors = null;
        this._MissionValue = null;
        this._Mission = {
            "name": "",
            "param": [],
        };
        this._cesiumImage = null;
        this._cesiumPosition = null;
    }

    // Getters
    get id() {
        return this._id;
    }

    get droneName() {
        return this._droneName;
    }

    get flightController() {
        return this._FlightController;
    }

    get droneType() {
        return this._droneType;
    }

    get droneModel() {
        return this._droneModel;
    }

    get vehicleType() {
        return this._VehicleType;
    }

    get defaultVehicleState() {
        return this._DefaultVehicleState;
    }

    get enableCollisionPassthrogh() {
        return this._EnableCollisionPassthrogh;
    }

    get enableCollisions() {
        return this._EnableCollisions;
    }

    get allowAPIAlways() {
        return this._AllowAPIAlways;
    }

    get enableTrace() {
        return this._EnableTrace;
    }

    get name() {
        return this._Name;
    }

    get image() {
        return this._image;
    }

    get color() {
        return this._color;
    }

    get X() {
        return this._X;
    }

    get Y() {
        return this._Y;
    }

    get Z() {
        return this._Z;
    }

    get Pitch() {
        return this._Pitch;
    }

    get Roll() {
        return this._Roll;
    }

    get Yaw() {
        return this._Yaw;
    }

    get Sensors() {
        return this._Sensors;
    }

    get MissionValue() {
        return this._MissionValue;
    }

    get cesiumImage() {
        return this._cesiumImage;
    }

    get cesiumPosition() {
        return this._cesiumPosition;
    }

    // Setters
    set id(value) {
        this._id = value;
    }

    set droneName(value) {
        this._droneName = value;
    }

    set flightController(value) {
        this._FlightController = value;
    }

    set droneType(value) {
        this._droneType = value;
    }

    set droneModel(value) {
        this._droneModel = value;
    }

    set vehicleType(value) {
        this._VehicleType = value;
    }

    set defaultVehicleState(value) {
        this._DefaultVehicleState = value;
    }

    set enableCollisionPassthrogh(value) {
        this._EnableCollisionPassthrogh = value;
    }

    set enableCollisions(value) {
        this._EnableCollisions = value;
    }

    set allowAPIAlways(value) {
        this._AllowAPIAlways = value;
    }

    set enableTrace(value) {
        this._EnableTrace = value;
    }

    set name(value) {
        this._Name = value;
    }

    set image(value) {
        this._image = value;
    }

    set color(value) {
        this._color = value;
    }

    set X(value) {
        this._X = value;
    }

    set Y(value) {
        this._Y = value;
    }

    set Z(value) {
        this._Z = value;
    }

    set Pitch(value) {
        this._Pitch = value;
    }

    set Roll(value) {
        this._Roll = value;
    }

    set Yaw(value) {
        this._Yaw = value;
    }

    set Sensors(value) {
        this._Sensors = value;
    }

    set MissionValue(value) {
        this._MissionValue = value;
    }

    set cesiumImage(value) {
        this._cesiumImage = value;
    }

    set cesiumPosition(value) {
        this._cesiumPosition = value;
    }

    setMissionObjectName(value) {
        this._Mission.name = value;
    }

    setMissionObjectParams(value) {
        this._Mission.param = value;
    }

    toJSONString() {
        return {
            "id": this._id,
            "droneName": this._droneName,
            "FlightController": this._FlightController,
            "droneType": this._droneType,
            "droneModel": this._droneModel,
            "VehicleType": this._VehicleType,
            "DefaultVehicleState": this._DefaultVehicleState,
            "EnableCollisionPassthrogh": this._EnableCollisionPassthrogh,
            "EnableCollisions": this._EnableCollisions,
            "AllowAPIAlways": this._AllowAPIAlways,
            "EnableTrace": this._EnableTrace,
            "Name": this._Name,
            "image": this._image,
            "color": this._color,
            "X": this._X,
            "Y": this._Y,
            "Z": this._Z,
            "Pitch": this._Pitch,
            "Roll": this._Roll,
            "Yaw": this._Yaw,
            "Sensors": this._Sensors,
            "MissionValue": this._MissionValue,
            "Mission": this._Mission,
        }
    }

}