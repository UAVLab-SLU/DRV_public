import { SadeModel } from "./SadeModel";

export class EnvironmentModel {

    constructor() {
        this._enableFuzzy = false;
        this._timeOfDayFuzzy = false;
        this._positionFuzzy = false;
        this._windFuzzy = false;
        this._TimeOfDay = null;
        this._UseGeo = false;
        this._time = null; 
        this._Wind = [];
        this._Origin = {
            "Latitude": 0,
            "Longitude": 0,
            "Name": "Specify Region",
            "Height": 0,
            "Radius": 0,
            "Position": 0,
        };
        this._sades = [];
        this._Origin.image = null;
        this._activeSadeZoneIndex = null;
    }

    // Getters
    get enableFuzzy() {
        return this._enableFuzzy;
    }

    get timeOfDayFuzzy() {
        return this._timeOfDayFuzzy;
    }

    get positionFuzzy() {
        return this._positionFuzzy;
    }

    get windFuzzy() {
        return this._windFuzzy;
    }

    get TimeOfDay() {
        return this._TimeOfDay;
    }

    get UseGeo() {
        return this._UseGeo;
    }

    get time() {
        return this._time;
    }

    get Wind() {
        return this._Wind;
    }

    get Origin() {
        return this._Origin;
    }

    get activeSadeZoneIndex(){
        return this._activeSadeZoneIndex;
    }

    // Setters
    set enableFuzzy(value) {
        this._enableFuzzy = value;
    }

    set timeOfDayFuzzy(value) {
        this._timeOfDayFuzzy = value;
    }

    set positionFuzzy(value) {
        this._positionFuzzy = value;
    }

    set windFuzzy(value) {
        this._windFuzzy = value;
    }

    set TimeOfDay(value) {
        this._TimeOfDay = value;
    }

    set UseGeo(value) {
        this._UseGeo = value;
    }

    set time(value) {
        this._time = value;
    }

    set Origin(value){
        this._Origin = value;
    }

    set Wind(value){
        this._Wind = value;
    }

    set activeSadeZoneIndex(value) {
        this._activeSadeZoneIndex = value;
    }

    getOriginLatitude(){
        return this._Origin.latitude;
    }

    getOriginLongitude(){
        return this._Origin.longitude;
    }

    getOriginRadius(){
        return this._Origin.radius;
    }

    getOriginHeight(){
        return this._Origin.height;
    }

    getOriginPosition(){
        return this._Origin.position;
    }

    getOriginName(){
        return this._Origin.name;
    }

    getOriginImage(){
        return this._Origin.image;
    }

    setOriginLatitude(value){
        this._Origin.latitude = value;
    }

    setOriginLongitude(value){
        this._Origin.longitude = value;
    }

    setOriginRadius(value){
        this._Origin.radius = value;
    }

    setOriginHeight(value){
        this._Origin.height = value;
    }

    setOriginPosition(value){
        this._Origin.position = value;
    }

    setOriginName(value){
        this._Origin.name = value;
    }

    setOriginImage(value){
        this._Origin.image = value;
    }

    addNewWind(windObj){
        this._Wind.push(windObj);
    }

    getWindBasedOnIndex(index){
        if(this._Wind.length > index){
            return this._Wind[index];
        }
    }

    updateWindBasedOnIndex(index, windModel){
        this._Wind[index] = windModel;
    }

    deleteWindBasedOnIndex(index){
        this._Wind = this._Wind.filter((_, i) => i !== index);
    }

    getAllSades(){
        return this._sades;
    }

    getSadesCount() {
        return this._sades.length;
    }

    getSadeBasedOnIndex(index){
        if(this._sades.length > index){
            return this._sades[index];
        }
    }

    addNewSade(sadeObj){
        this._sades.push(sadeObj);
    }

    updateSadeBasedOnIndex(index, sade){
        this._sades[index] = sade;
    }

    deleteSadeBasedOnIndex(index){
        this._sades = this._sades.filter((_, i) => i !== index);
    }

    popLastSade(){
        this._sades.pop();
    }

    static getReactStateBasedUpdate(instance){
        let model = new EnvironmentModel();
        model.enableFuzzy = instance.enableFuzzy;
        model.timeOfDayFuzzy =instance.timeOfDayFuzzy;
        model.positionFuzzy = instance.positionFuzzy;
        model.setOriginLatitude(instance.setOriginLatitude);
        model.setOriginLongitude(instance.setOriginLongitude);
        model.setOriginHeight(instance.setOriginHeight);
        model.setOriginRadius(instance.setOriginRadius);
        model.setOriginPosition(instance.setOriginPosition);
        model.TimeOfDay =instance.TimeOfDay;
        model.UseGeo = instance.UseGeo;
        model.time = instance.time;
        model.Origin = instance.Origin;
        model.Wind = instance.Wind;
        model.activeSadeZoneIndex = instance.activeSadeZoneIndex;
        const sades = instance.getAllSades();
        for(let i =0; i < sades.length; i++){
            model.addNewSade(sades[i]);
        }
        return model
    }

    toJSONString(){
        return {
            "enable_fuzzy": this._enableFuzzy,
            "time_of_day_fuzzy": this._timeOfDayFuzzy,
            "position_fuzzy": this._positionFuzzy,
            "wind_fuzzy": this._windFuzzy,
            "wind": this._Wind?.map( (obj) => obj.toJSONString() ),
            "origin": this._Origin,
            "time_of_day": this._TimeOfDay,
            "use_geo": this.UseGeo,
            "time": this._time,
            "sades" : this._sades?.map( (obj) => obj.toJSONString() )
        }
    }

}
