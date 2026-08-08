use serde::Serialize;

use super::AlbumDescBuilder;

use photo_album_core::{Image, ImageData};

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
    timestamp: u64,
    lat: f64,
    lon: f64,
    dir: f32,
    data: Vec<AlbumImageDataDesc>,
}

impl AlbumImageDesc {
    pub fn of_image(album_desc: &AlbumDescBuilder, tag: &str, image: &Image) -> Self {
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
