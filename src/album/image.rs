use std::{
    path::{Path, PathBuf},
    str::FromStr,
};

use image::ImageReader;

use super::Error;

use crate::Album;

#[derive(Debug, Default)]
pub struct ImageData {
    /// Width of the image (bounded by level of detail)
    w: u32,
    /// Height of the image (bounded by level of detail)
    h: u32,
    /// Level of detail as given by the album
    lod: usize,
    /// Image file where the image should be written to (at the specified level of detail)
    image_file: PathBuf,
}

impl ImageData {
    pub fn of_img<P: AsRef<Path>>(album: &Album, path: P) -> Result<Self, Error> {
        let p = album.find_image_path(path)?;
        let img = ImageReader::open(p)?;
        let img = img.decode()?.into_rgb8();
        let w = img.width();
        let h = img.height();
        Ok(Self {
            w,
            h,
            ..Default::default()
        })
    }
    pub fn aspect_ratio(&self) -> f32 {
        (self.w as f32) / (self.h as f32)
    }
    pub fn width(&self) -> u32 {
        self.w
    }
    pub fn height(&self) -> u32 {
        self.h
    }
}

#[derive(Debug, Default)]
pub struct Image {
    /// Name of the page description, unique within the site
    name: String,
    /// Image source file, when created from an ImageDesc
    src: PathBuf,
    /// Default caption to use for the image
    caption: String,
    /// Image data
    image_data: Vec<ImageData>,
    /// Latitude
    lat: f64,
    /// Longitude
    lon: f64,
}

impl Image {
    pub fn set_name<I: Into<String>>(&mut self, name: I) {
        self.name = name.into();
    }
    pub fn set_caption<I: Into<String>>(&mut self, caption: I) {
        self.caption = caption.into();
    }
    pub fn set_src(&mut self, album: &mut Album, src: &str) -> Result<(), Error> {
        self.src = PathBuf::from_str(src).unwrap(); // Infallible
        self.image_data = vec![ImageData::of_img(album, &self.src)?];
        Ok(())
    }
    pub fn aspect_ratio(&self) -> f32 {
        self.image_data[0].aspect_ratio()
    }
    pub fn width(&self) -> u32 {
        self.image_data[0].width()
    }
    pub fn height(&self) -> u32 {
        self.image_data[0].height()
    }
    pub fn name(&self) -> &str {
        &self.name
    }
    pub fn caption(&self) -> &str {
        &self.caption
    }
}
