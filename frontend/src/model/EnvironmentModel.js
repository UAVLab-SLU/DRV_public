

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
        this._Origin.Image = null;
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

    getOriginLatitude(){
        return this._Origin.Latitude;
    }

    getOriginLongitude(){
        return this._Origin.Longitude;
    }

    getOriginRadius(){
        return this._Origin.Radius;
    }

    getOriginHeight(){
        return this._Origin.Height;
    }

    getOriginPosition(){
        return this._Origin.Position;
    }

    getOriginName(){
        return this._Origin.Name;
    }

    getOriginImage(){
        return this._Origin.Image;
    }

    setOriginLatitude(value){
        this._Origin.Latitude = value;
    }

    setOriginLongitude(value){
        this._Origin.Longitude = value;
    }

    setOriginRadius(value){
        this._Origin.Radius = value;
    }

    setOriginHeight(value){
        this._Origin.Height = value;
    }

    setOriginPosition(value){
        this._Origin.Position = value;
    }

    setOriginName(value){
        this._Origin.Name = value;
    }

    setOriginImage(value){
        this._Origin.Image = value;
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
        const sades = instance.getAllSades();
        for(let i =0; i < sades.length; i++){
            model.addNewSade(sades[i]);
        }
        return model
    }

    toJSONString(){
        return {
            "enableFuzzy": this._enableFuzzy,
            "timeOfDayFuzzy": this._timeOfDayFuzzy,
            "positionFuzzy": this._positionFuzzy,
            "windFuzzy": this._windFuzzy,
            "Wind": this._Wind?.map( (obj) => obj.toJSONString() ),
            "Origin": this._Origin,
            "TimeOfDay": this._TimeOfDay,
            "UseGeo": this.UseGeo,
            "time": this._time,
            "Sade" : this._sades?.map( (obj) => obj.toJSONString() )
        }
    }

}
