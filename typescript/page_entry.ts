import { HtmlElement } from "./html.js";

import { AlbumGui } from "./album.js";
import { AlbumImage } from "./album_image.js";
import { AlbumPage } from "./album_page.js";
import { AlbumStyle } from "./album_style.js";
import { AlbumEntryDesc } from "./album_desc.js";
import { LayoutData } from "./layout_data.js";

export class Entry {
  layout: LayoutData;
  style: AlbumStyle;

  constructor(layout: LayoutData, style: AlbumStyle = new AlbumStyle()) {
    this.layout = layout;
    this.style = style;
  }

  static of_desc(album_gui: AlbumGui, desc: AlbumEntryDesc): Entry {
    if (desc.image === undefined) {
      throw new Error(`No image specified for page item entry`);
    }
    const image = album_gui.album.get_image(desc.image);
    if (image === null) {
      throw new Error(`Failed to find image ${desc.image} in album`);
    }
    let lod = 0;
    if (desc.lod !== undefined) {
      lod = desc.lod;
    }
    const layout = new LayoutData(desc);
    if (desc.page !== undefined && desc.page !== null) {
      const page = album_gui.album.get_page(desc.page);
      if (page === null) {
        throw new Error(`Failed to find page ${desc.page} in album`);
      }
      return new EntryPage(page, image, lod, layout, new AlbumStyle());
    } else {
      return new EntryImage(image, lod, layout, new AlbumStyle());
    }
  }

  create_div(
    page:AlbumPage,
    parent: HtmlElement,
    styles: [string, string][],
  ) {
    const div = parent.add_ele("div", {}, [["align", "center"]]);
    div.set_styles(styles);
    this.fill_div(page, div);
  }

  fill_div(_page:AlbumPage, _div: HtmlElement): void {}
}

export class EntryImage extends Entry {
  img: AlbumImage;
  lod: number;
  constructor(
    img: AlbumImage,
    lod: number,
    layout: LayoutData,
    style: AlbumStyle = new AlbumStyle(),
  ) {
    super(layout, style);
    this.img = img;
    this.lod = lod;
  }

  override fill_div(
    page: AlbumPage,
    div: HtmlElement,
  ) {
    const img_lod = this.img.get_lod(this.lod, this.layout.w);
    if (img_lod !== null) {
      page.create_img_link(div, img_lod, this.layout.w);
      page.create_img_caption(div, this.img, img_lod);
    }
  }
}

export class EntryPage extends Entry {
  img: AlbumImage;
  lod: number;
  page: AlbumPage;
  constructor(
    page: AlbumPage,
    img: AlbumImage,
    lod: number,
    layout: LayoutData,
    style: AlbumStyle = new AlbumStyle(),
  ) {
    super(layout, style);
    this.page = page;
    this.img = img;
    this.lod = lod;
  }

  override fill_div(
    page: AlbumPage,
    div: HtmlElement,
  ) {
    const img_lod = this.img.get_lod(this.lod, this.layout.w);
    this.style.ele_style_attr(div, [
      "color",
      "background",
      "pad",
      "border",
      "margin",
    ]);

    if (img_lod !== null) {
      const a = page.create_a_set_page(div, this.page);
      this.style.ele_style_attr(a, ["color"]);
      page.create_img_tag(a, img_lod, this.layout.w);
    }
    if (this.page.title !== null) {
      div.add_ele("p");
      const a = page.create_a_set_page(div, this.page);
      this.style.ele_style_attr(a, ["color"]);
      a.add_content(this.page.title);
    }
  }
}
