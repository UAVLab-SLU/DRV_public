
export class WindModel {

    constructor() {
        this._windType = "";
        this._windDirection = "";
        this._windVelocity = "";
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
        this._windVelocity = value;
    }

    set fluctuationPercentage(value) {
        this._fluctuationPercentage = value;
    }

    toJSONString(){
        return {
            "windType" : this._windType,
            "windDirection" : this._windDirection,
            "windVelocity" : this._windVelocity,
            "fluctuationPercentage" : this._fluctuationPercentage,
        }
    }
}