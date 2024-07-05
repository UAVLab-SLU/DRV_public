export class SadeModel {
  constructor() {
    this._id = 0;
    this._sadeName = null;
    this._Name = null;
    this._latitude1 = null;
    this._longitude1 = null;
    this._height = 30;
    this._length = null;
    this._width = null;
    this._rectangle = null;
  }

  get id() {
    return this._id;
  }

  get sadeName() {
    return this._sadeName;
  }

  get Name() {
    return this._Name;
  }

  get latitude1() {
    return this._latitude1;
  }

  get longitude1() {
    return this._longitude1;
  }

  get height() {
    return this._height;
  }

  get length() {
    return this._length;
  }

  get width() {
    return this._width;
  }

  get rectangle() {
    return this._rectangle;
  }

  set id(value) {
    this._id = value;
  }

  set sadeName(value) {
    this._sadeName = value;
  }

  set Name(value) {
    this._Name = value;
  }

  set latitude1(value) {
    this._latitude1 = value;
  }

  set longitude1(value) {
    this._longitude1 = value;
  }

  set height(value) {
    this._height = value;
  }

  set length(value) {
    this._length = value;
  }

  set width(value) {
    this._width = value;
  }

  set rectangle(value) {
    this._rectangle = value;
  }
}
