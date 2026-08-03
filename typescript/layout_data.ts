import { AlbumEntryDesc } from "./album_desc.js";

export class LayoutData {
  x: number = 0;
  y: number = 0;
  w: number = 0;
  h: number = 0;
  num_cols: number = 1;
  num_rows: number = 1;

  constructor({
    x: x = 0,
    y: y = 0,
    w: w = 100,
    h: h = 100,
    num_cols: num_cols = 1,
    num_rows: num_rows = 1,
  }: AlbumEntryDesc) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.num_cols = num_cols;
    this.num_rows = num_rows;
  }
}
