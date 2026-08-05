use std::path::Path;

use serde::Serialize;

use crate::album::{Album, Image, ImageData, Page, PageImage, PagePage};

#[derive(Debug, Default, Serialize)]
pub struct AlbumImageDataDesc {
    filename: String,
    width: u32,
    height: u32,
    lod: usize,
}
impl AlbumImageDataDesc {
    fn of_image_data(album_desc: &AlbumDescBuilder, image_data: &ImageData) -> Self {
        let mut desc = Self::default();
        desc.lod = image_data.lod().as_usize();
        desc.width = image_data.width();
        desc.height = image_data.height();
        desc.filename = album_desc.desc_filename_of_filename(image_data.image_file());
        desc
    }
}

#[derive(Debug, Default, Serialize)]
pub struct AlbumImageDesc {
    tag: String,
    caption: String,
    data: Vec<AlbumImageDataDesc>,
}

impl AlbumImageDesc {
    fn of_image(album_desc: &AlbumDescBuilder, tag: &str, image: &Image) -> Self {
        let mut desc = Self::default();
        desc.tag = tag.to_owned();
        desc.caption = image.caption().into();
        for id in image.image_data() {
            desc.data
                .push(AlbumImageDataDesc::of_image_data(album_desc, id));
        }
        desc
    }
}

#[derive(Debug, Serialize)]
pub struct AlbumEntryDesc {
    x: u32,
    y: u32,
    w: u32,
    h: u32,
    num_cols: usize,
    num_rows: usize,
    image: Option<String>,
    lod: usize,
    page: Option<String>,
    entries: Vec<AlbumEntryDesc>,
}

impl std::default::Default for AlbumEntryDesc {
    fn default() -> Self {
        Self {
            x: 0,
            y: 0,
            w: 100,
            h: 100,
            num_cols: 1,
            num_rows: 1,
            image: None,
            lod: 0,
            page: None,
            entries: vec![],
        }
    }
}
impl AlbumEntryDesc {
    fn of_page_page(album_desc: &AlbumDescBuilder, page: &PagePage) -> Self {
        let mut desc = Self::default();
        desc.x = page.style().x;
        desc.y = page.style().y;
        desc.w = page.style().width;
        desc.h = page.style().height;
        desc.num_cols = page.style().num_cols;
        desc.num_rows = page.style().num_rows;
        desc.lod = page.style().lod;
        desc.page = album_desc
            .album
            .page(page.page())
            .map(|p| p.name().to_owned());
        desc.image = album_desc
            .album
            .image(page.image())
            .map(|p| p.name().to_owned());
        desc
    }
    fn of_page_image(album_desc: &AlbumDescBuilder, image: &PageImage) -> Self {
        let mut desc = Self::default();
        desc.x = image.style().x;
        desc.y = image.style().y;
        desc.w = image.style().width;
        desc.h = image.style().height;
        desc.num_cols = image.style().num_cols;
        desc.num_rows = image.style().num_rows;
        desc.lod = image.style().lod;
        desc.image = album_desc
            .album
            .image(image.image())
            .map(|p| p.name().to_owned());

        desc
    }
}

#[derive(Debug, Default, Serialize)]
pub struct AlbumPageDesc {
    tag: String,
    layout: String,
    title: String,
    entries: Vec<AlbumEntryDesc>,
}

impl AlbumPageDesc {
    fn of_page(album_desc: &AlbumDescBuilder, tag: &str, page: &Page) -> Self {
        let mut desc = Self::default();
        desc.tag = tag.to_owned();
        desc.layout = "grid".to_owned();
        desc.title = page.title().to_owned();

        for pp in page.pages() {
            desc.entries
                .push(AlbumEntryDesc::of_page_page(album_desc, pp));
        }
        for ip in page.images() {
            desc.entries
                .push(AlbumEntryDesc::of_page_image(album_desc, ip));
        }
        desc
    }
}

#[derive(Debug, Default, Serialize)]
pub struct AlbumDesc {
    default_page: String,
    img_rel_dir: String,
    images: Vec<AlbumImageDesc>,
    pages: Vec<AlbumPageDesc>,
}

struct AlbumDescBuilder<'build> {
    album: &'build Album,
}
impl<'build> AlbumDescBuilder<'build> {
    fn desc_filename_of_filename(&self, filename: Option<&Path>) -> String {
        if let Some(mut filename) = filename {
            /*
            if filename.starts_with("output") {
                filename = filename.strip_prefix("output").unwrap();
            }
            */
            filename.as_os_str().to_str().unwrap_or("").to_owned()
        } else {
            "".into()
        }
    }
}
impl AlbumDesc {
    pub fn of_album(album: &Album) -> Self {
        let build = AlbumDescBuilder { album: album };
        let img_rel_dir = "../";
        let mut desc = Self::default();
        let mut image_tags: Vec<_> = album.image_tags().collect();
        image_tags.sort();
        for image_name in image_tags {
            // Must be able to find the image tag
            let i = album.find_image_index(image_name).unwrap();
            let i = album.image(i).unwrap();
            let image_desc = AlbumImageDesc::of_image(&build, image_name, i);
            desc.images.push(image_desc);
        }
        // Pages must be added in the order they exist, as they form a hierarchy and parents must come after leaves
        for page in album.pages() {
            // Must be able to find the page tag
            let page_desc = AlbumPageDesc::of_page(&build, page.name(), page);
            desc.pages.push(page_desc);
        }
        let default_page = album
            .pages()
            .last()
            .map(|a| a.name().to_owned())
            .unwrap_or_default();
        desc.default_page = default_page.into();
        desc.img_rel_dir = img_rel_dir.into();
        desc
    }
    /// Generate the json of the [CameraInstance]
    pub fn to_json(&self, pretty: bool) -> crate::Result<String> {
        if pretty {
            Ok(serde_json::to_string_pretty(self)?)
        } else {
            Ok(serde_json::to_string(self)?)
        }
    }
}
