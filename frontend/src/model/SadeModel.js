import { v4 as uuidv4 } from "uuid";
import { findRectangleCorners } from "../utils/mapUtils";

export class SadeModel {
  constructor(name = "") {
    this.id = uuidv4();
    this.name = name || `Zone-${this.id.substring(0, 4)}`;
    this.rectangle = null;
    this.length = 0;
    this.width = 0;
    this.height = 0;
    this.centerLat = null;
    this.centerLong = null;
    this._vertices = null;
  }

  /** Recalculate corner vertices from current rectangle + dimensions */
  updateVertices() {
    if (!this.centerLong || !this.centerLat || !this.length || !this.width) {
      this._vertices = null;
      return;
    }
    this._vertices = findRectangleCorners(
      this.centerLong,
      this.centerLat,
      this.length,
      this.width,
    );
  }

  get vertices() {
    return this._vertices;
  }

  toJSON() {
    return {
      name: this.name,
      centerLat: this.centerLat,
      centerLong: this.centerLong,
      length: this.length,
      width: this.width,
      height: this.height,
      vertices: this._vertices,
    };
  }
}
