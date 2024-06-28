

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
            "Height": 0
        };
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

    setOriginLatitude(value){
        this._Origin.Latitude = value;
    }

    setOriginLongitude(value){
        this._Origin.Longitude = value;
    }

    setOriginHeight(value){
        this._Origin.Height = value;
    }

    setOriginName(value){
        this._Origin.Name = value;
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

    static getReactStateBasedUpdate(instance){
        let model = new EnvironmentModel();
        model.enableFuzzy = instance.enableFuzzy;
        model.timeOfDayFuzzy =instance.timeOfDayFuzzy;
        model.positionFuzzy = instance.positionFuzzy;
        model.setOriginLatitude = instance.setOriginLatitude;
        model.setOriginLongitude =instance.setOriginLongitude;
        model.TimeOfDay =instance.TimeOfDay;
        model.UseGeo = instance.UseGeo;
        model.time = instance.time;
        model.Origin = instance.Origin;
        model.Wind = instance.Wind;
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
            "time": this._time
        }
    }

}
