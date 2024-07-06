export class SadeModel {
  constructor(name = 'Sade Zone') {
    this._id = 0;
    this._name = name;
    this._latitude1 = null;
    this._longitude1 = null;
    this._height = 30;
    this._length = null;
    this._width = null;
    this._rectangle = null;
    // TO-DO: remove if unnecessary
    this._lengthLabelCoords = null;
    this._widthLabelCoords = null;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
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

  get lengthLabelCoords() {
    return this._lengthLabelCoords;
  }

  get widthLabelCoords() {
    return this._widthLabelCoords;
  }

  set id(value) {
    this._id = value;
  }

  set name(value) {
    this._name = value;
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

  set lengthLabelCoords(value) {
    this._lengthLabelCoords = value;
  }

  set widthLabelCoords(value) {
    this._widthLabelCoords = value;
  }
}
