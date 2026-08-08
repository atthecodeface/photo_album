import { HtmlElement } from "./html.js";

import { Album } from "./album.js";
import { Tab } from "./photo_album.js";
import { WebglCanvas } from "./webgl_canvas.js";

export class PanoramaTab implements Tab {
  album: Album;
  div: HtmlElement;
  webgl_canvas: WebglCanvas;
  tab_uses_floating_canvas: boolean = true;

  constructor(album: Album, div: HtmlElement, webgl_canvas:WebglCanvas) {
    this.album = album;
    this.div = div;
    this.webgl_canvas = webgl_canvas;
    this.div.clear();
  }

  tab_deselect(): void {}
  tab_select(): void {
    this.webgl_canvas.redraw();
 }

  tab_set_search(_hash_search: string): void {}
}
