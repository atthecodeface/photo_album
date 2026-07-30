import { HtmlElement } from "./html.js";

interface StyleDesc {
  w_px?: number;
  h_px?: number;
  background?: string;
  pad?: string;
  border?: string;
  margin?: string;
  color?: string;
}

export class AlbumStyle {
  w_px: number | null = null;
  h_px: number | null = null;
  background: string | null = null;
  pad: string | null = null;
  border: string | null = null;
  margin: string | null = null;
  color: string | null = null;
  clone(): AlbumStyle {
    const style = new AlbumStyle();
    Object.assign(style, this);
    return style;
  }
  merge(higher_priority: AlbumStyle) {
    for (const k of Object.entries(higher_priority)) {
      if (k[1] !== null) {
        (this as any)[k[0]] = k[1];
      }
    }
  }
  merged_with(higher_priority: AlbumStyle): AlbumStyle {
    const style = this.clone();
    style.merge(higher_priority);
    return style;
  }

  constructor(s: StyleDesc = {}) {
    const style_names = Object.getOwnPropertyNames(this);
    for (const k of Object.entries(s)) {
      if (k[1] !== undefined) {
        if (style_names.includes(k[0])) {
          (this as any)[k[0]] = k[1];
        }
      }
    }
  }

  ele_style_attr(ele: HtmlElement, style_names: string[], aspect_ratio: number = 1.0) {
    let width = this.w_px;
    if (width === null) {
      if (this.h_px !== null) {
        width = this.h_px * aspect_ratio;
      }
    }
    const styles: [string, string][] = [];
    if (style_names.includes("width") && (width !== null)) {
      styles.push(["width", `${width}px`]);
    }
    for (const kv of Object.entries(this)) {
      if ((kv[1] !== null) && (style_names.includes(kv[0]))) {
        if (kv[0] !== "width") {
          styles.push([kv[0], kv[1]]);
        }
      }
      ele.set_styles(styles);
    }
  }
}
