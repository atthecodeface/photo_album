import { HtmlElement } from "./html.js";

import { AlbumGui } from "./album.js";
import { AlbumImage, AlbumImageLod } from "./album_image.js";
import { AlbumPageDesc } from "./album_desc.js";
import { AlbumStyle } from "./album_style.js";
import { PageLayout, PageLayoutTable, PageLayoutPlace } from "./page_layout.js";

export class AlbumPage {
  album_gui: AlbumGui;
  layout: PageLayout;
  style: AlbumStyle;
  title: string;
  heading: string;
  _tag: string;

  constructor(
    album_gui: AlbumGui,
    tag: string,
    title: string,
    layout: PageLayout = new PageLayoutTable(),
    style: AlbumStyle = new AlbumStyle(),
  ) {
    this.album_gui = album_gui;
    this._tag = tag;
    this.style = style;
    this.title = title;
    this.heading = title;
    this.layout = layout;
  }

  static of_desc(
    album_gui: AlbumGui,
    {
      tag: t = "<no tag>",
      title: tt = "<no title given>",
      layout: al = "grid",
      entries: e = [],
    }: AlbumPageDesc,
  ): AlbumPage {
    let layout : PageLayout = new PageLayoutTable();
    if (al == "placed") {
      layout = new PageLayoutPlace();
    }
    const page = new AlbumPage(album_gui, t, tt, layout);

    for (const entry_desc of e) {
      page.layout.add_entry(album_gui, entry_desc);
    }
    return page;
  }

  tag(): string {
    return this._tag;
  }

  create_img_tag(
    parent: HtmlElement,
    img_lod: AlbumImageLod,
    width: number,
  ): HtmlElement {
     const e = parent.add_ele("img", {}, [
        ["src", this.album_gui.album.img_filename(img_lod.filename)],
      ]);
    e.set_styles([["width", `${width}px`]]);
    return e;
  }

  create_img_link(
    parent: HtmlElement,
    img_lod: AlbumImageLod,
    width: number,
  ): HtmlElement {
    const href_filename = this.album_gui.album.img_filename(img_lod.filename);
    const a = parent.add_ele("a", {}, [["href", href_filename]]);
    this.create_img_tag(a, img_lod, width);
    return a;
  }

  create_img_caption(
    parent: HtmlElement,
    image: AlbumImage,
    img_lod: AlbumImageLod,
  ): HtmlElement | null{
    if (image.caption() != "") {
      parent.add_ele("p");
      const href_filename = this.album_gui.album.img_filename(img_lod.filename);
      const a = parent.add_ele("a", {}, [["href", href_filename]]);
      this.style.ele_style_attr(a, ["color"]);
      a.add_content(image.caption());
      return a;
    } else {
      return null;
    }
  }

  create_a_set_page(
    parent: HtmlElement,
    page: AlbumPage,
  ): HtmlElement {
    const album_gui = this.album_gui;
    const href = "#select_this_page" + page.tag();
    const a = parent.add_ele("a", {}, [["href", href]]);
    const this_tag = page._tag;
    a.ele.addEventListener("click", (_e) => album_gui.album_set_page(this_tag));
    return a;
  }

  mk_body(html: HtmlElement) {
    html.clear();
    this.style.ele_style_attr(html, [
      "color",
      "background",
      "pad",
      "border",
      "margin",
    ]);
    // text = doc.createTextNode(this.heading);
    // h1.appendChild(text);
    // div.appendChild(h1);
    this.layout.create_html(this, html);
  }
}
