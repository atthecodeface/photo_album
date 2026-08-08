import photo_album_init from "../wasm/photo_album.js";
// import * as photo_album_wasm from "../wasm/photo_album.js";

import { Tabs } from "./tabs.js";

import { Application } from "./application.js";
import { Album, AlbumGui } from "./album.js";
import { AlbumTab } from "./album_tab.js";
import { ThumbnailsTab } from "./thumbnails_tab.js";
import { HtmlElement } from "./html.js";

import { WebglCanvas } from "./webgl_canvas.js";
import { Log, Logger } from "./log.js";
import { PanoramaTab } from "./panorama_tab.js";

export class LogTab implements Tab {
  tab_uses_floating_canvas: boolean = false;
  tab_deselect(): void {
  }
  tab_select(): void {
  }
  tab_set_search(_hash_search: string): void { }
}

export interface Tab {
  tab_uses_floating_canvas: boolean;
  tab_select(): void;
  tab_deselect(): void;
  tab_set_search(hash_search:string): void;
}

class PhotoAlbumApplication extends Application {
  photo_album: PhotoAlbum | null = null;

  constructor() {
    super([photo_album_init]);
  }

  override application_init() {
    this.photo_album = new PhotoAlbum(
      this.application_location,
    );
  }
}

class PhotoAlbum implements AlbumGui {
  tabs: Tabs<Tab>;
  album: Album;
  album_tab: AlbumTab;
  thumbnails_tab: ThumbnailsTab;
  panorama_tab: PanoramaTab;
  pages: string[] = [];
  view_selector: string;
  // fixed_div: HtmlElement;
  floating_div: HtmlElement;

  logger: Log;
  log: Logger;
  webgl_canvas: WebglCanvas;

  constructor(location: Location) {
    console.log("Created PhotoAlbum with search of:", location);

    this.album = new Album();
    this.logger = new Log("log");
//    div?: HtmlElement | string,
//    min_severity: Severity = Severity.Info,
//    console_min_severty: Severity = Severity.Warning,

    this.log = new Logger(this.logger, "photo_album");
    this.floating_div = new HtmlElement(document.getElementById("floating-div")!);

    this.webgl_canvas = new WebglCanvas(this.logger, new HtmlElement(document.getElementById("webgl")!));

    const album_div = new HtmlElement(document.getElementById("album_content")!);
    this.album_tab = new AlbumTab(this.album, album_div);

    const thumbnail_div = new HtmlElement(document.getElementById("thumbnail_content")!);
    this.thumbnails_tab = new ThumbnailsTab(this.album, thumbnail_div);

    const panorama_div = new HtmlElement(document.getElementById("panorama_content")!);
    this.panorama_tab = new PanoramaTab(this.album, panorama_div, this.webgl_canvas);

    this.tabs = new Tabs("tab-list", this.tab_select.bind(this), []);
    this.tabs.add_tab("album", "Album", this.album_tab);
    this.tabs.add_tab("thumbnails", "Thumbnails", this.thumbnails_tab);
    this.tabs.add_tab("panorama", "Panorama", this.panorama_tab);
    this.tabs.add_tab("log", "Log", new LogTab());

    // this.tabs.add_action("Previous", this.album_set_previous_page.bind(this));
    this.tabs.add_action("Top", () => { this.album_set_select("") }, "#album");

    window.addEventListener("hashchange", this.hash_changed.bind(this));

    const decode = this.decode_hash(location.hash);
    if (decode[0] !== "") {
      this.tabs.select(decode[0]);
    }
    this.view_selector = decode[1];

    const uri = "photo_album.json";
    this.fetch_json(uri)
      .then(
        this.album_add_json.bind(this)
      );
  }

  hash_changed(event: HashChangeEvent) {
    const decode = this.decode_hash(event.newURL);
    console.log("hash_changed:", decode[0], decode[1]);
    if (decode[0] !== "") {
      this.tabs.select(decode[0]);
    }
    this.album_tab.tab_set_search(decode[1]);
  }

  decode_hash(hash: string | undefined): [string, string] {
    let tab_to_select = "album";
    hash = hash!.split("#", 2)[1];
    if (hash !== undefined) {
      tab_to_select = hash.split("?")[0]!;
    } else {
      hash = "";
    }
    let search = hash.split("?", 2)[1];
    if (search === undefined) {
      search = "";
    }
    this.log.info("select", tab_to_select + ":" + search);
    return [tab_to_select, search];
  }

  /**
   * Add an AlbumDesc JSON to the album loaded; ideally there is only one
   *
   * @param json Json fetched that should contain and AlbumDesc
   */
  album_add_json(json: any):void {
    try {
      this.log.info("album", "Json for album retrieved");
      this.album.of_desc(this, json);
      this.log.info("album", "Album data added");
      this.album_tab.tab_set_search(this.view_selector);
      const tab_name = this.tabs.selected_tab();
      const tab = this.tabs.tab(tab_name)!;
      this.tab_select(tab, tab_name);
    }
    catch (e) {
      alert(`Failed to read album json: ${e}`);
    }
  }

  /**
   * Get a promise resulting from the fetch the JSON for an AlbumDesc
   *
   * @param uri URI to fetch the AlbumDesc JSON from
   * @returns A promise which should contain the JSON
   */
  async fetch_json(uri:string): Promise<any> {
      return fetch(uri)
          .then((response) => {
              if (!response.ok) {
                  throw new Error(`Failed to fetch ${uri}: ${response.status}`);
              }
              return response.json();
          })
  }

  tab_select(tab: Tab, _tab_name: string) {
      if (tab.tab_uses_floating_canvas) {
        this.floating_div.set_style("display", "");
      } else {
        this.floating_div.set_style("display", "none");
      }
    tab.tab_select();
  }

  album_set_select(select: string): void {
    this.log.info("album_set_select", select);
    this.album_tab.tab_set_search(select);
  }

}

(window as any).application = new PhotoAlbumApplication();
