use std::path::{Path, PathBuf};

use image::RgbImage;

use super::Lod;

///
#[derive(Debug, Default)]
pub struct ImageData {
    /// Width of the image (bounded by level of detail)
    w: u32,
    /// Height of the image (bounded by level of detail)
    h: u32,
    /// Level of detail as given by the album
    ///
    /// 0 indicates that the image is the *original*
    lod: Lod,
    /// Image file where the image should be written to (at the specified level of detail)
    ///
    /// Initially this is empty, i.e. 'unset', and the image_file method returns None
    image_file: PathBuf,
}

impl ImageData {
    pub fn of_img((width, height): (u32, u32)) -> Self {
        let w = width;
        let h = height;
        Self {
            w,
            h,
            ..Default::default()
        }
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
    pub fn num_pix(&self) -> u32 {
        self.w * self.h
    }
    pub fn lod(&self) -> Lod {
        self.lod
    }
    pub fn set_image_file(&mut self, path: PathBuf) {
        self.image_file = path;
    }
    /// Returns the path, or None if has not yet been set
    ///
    /// The path should be set through the Album
    pub fn image_file(&self) -> Option<&Path> {
        if self.image_file.as_path().as_os_str().is_empty() {
            None
        } else {
            Some(self.image_file.as_path())
        }
    }
    pub fn at_lod(&self, lod: Lod) -> Option<Self> {
        if let Some((w, h)) = lod.lod_wh(self.w, self.h) {
            Some(Self {
                w,
                h,
                lod,
                ..Default::default()
            })
        } else {
            None
        }
    }
}
