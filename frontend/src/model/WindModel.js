
export class WindModel {

    constructor() {
        this._windType = "";
        this._windDirection = "";
        this._windVelocity = 0;
        this._fluctuationPercentage = 0;
    }

    get windType(){
        return this._windType;
    }

    get windDirection(){
        return this._windDirection;
    }

    get windVelocity(){
        return this._windVelocity;
    }

    get fluctuationPercentage() {
        return this._fluctuationPercentage;
    }

    set windType(value){
        this._windType = value;
    }

    set windDirection(value){
        this._windDirection = value;
    }

    set windVelocity(value){
        this._windVelocity = parseInt(value);
    }

    set fluctuationPercentage(value) {
        this._fluctuationPercentage = value;
    }

    toJSONString(){
        return {
            "wind_type" : this._windType,
            "wind_direction" : this._windDirection,
            "wind_velocity" : this._windVelocity,
            "fluctuation_percentage" : this._fluctuationPercentage,
        }
    }
}