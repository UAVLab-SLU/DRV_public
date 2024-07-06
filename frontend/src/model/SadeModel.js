export class SadeModel {
  constructor(name = 'Sade Zone') {
    this._id = 0;
    this._name = name;
    this._centerLat = null;
    this._centerLong = null;
    this._height = 30;
    this._length = null;
    this._width = null;
    this._rectangle = null;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get centerLat() {
    return this._centerLat;
  }

  get centerLong() {
    return this._centerLong;
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

  set name(value) {
    this._name = value;
  }

  set centerLat(value) {
    this._centerLat = value;
  }

  set centerLong(value) {
    this._centerLong = value;
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
