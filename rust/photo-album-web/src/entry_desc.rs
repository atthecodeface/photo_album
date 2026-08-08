use serde::Serialize;

use super::AlbumDescBuilder;

use photo_album_core::{PageImage, PagePage, Style};

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
    fn of_style(style: &Style) -> Self {
        let mut desc = Self::default();
        desc.x = *style.x();
        desc.y = *style.y();
        desc.w = *style.width();
        desc.h = *style.height();
        desc.num_cols = *style.num_cols();
        desc.num_rows = *style.num_rows();
        desc.lod = *style.lod();
        desc
    }

    pub fn of_page_page(album_desc: &AlbumDescBuilder, page: &PagePage) -> Self {
        let mut desc = Self::of_style(page.style());
        desc.page = album_desc
            .album()
            .page(page.page())
            .map(|p| p.name().to_owned());
        desc.image = album_desc
            .album()
            .image(page.image())
            .map(|p| p.name().to_owned());
        desc
    }
    pub fn of_page_image(album_desc: &AlbumDescBuilder, image: &PageImage) -> Self {
        let mut desc = Self::of_style(image.style());
        desc.image = album_desc
            .album()
            .image(image.image())
            .map(|p| p.name().to_owned());

        desc
    }
}
