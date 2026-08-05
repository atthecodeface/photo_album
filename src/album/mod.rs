use std::{
    cmp::max,
    path::{Path, PathBuf},
};

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("cannot find file {0}")]
    CannotFindFile(PathBuf),
    #[error("failed to open file {0}: {1}")]
    FailedToOpenImage(String, std::io::Error),
    #[error("image handling failed {0}")]
    Image(#[from] ::image::ImageError),
    #[error("cannot create output image path from {0}")]
    CannotCreateOutputImagePath(PathBuf),
    #[error("album already contains image {image_name}")]
    AlbumAlreadyContainsImage { image_name: String },
    #[error("album does not contain image {image_name}")]
    AlbumDoesNotContainImage { image_name: String },
    #[error("album already contains image {page_name}")]
    AlbumAlreadyContainsPage { page_name: String },
    #[error("album does not contain page {page_name}")]
    AlbumDoesNotContainPage { page_name: String },
    #[error("{0}")]
    PathSet(#[from] crate::path_set::Error),
    #[error("level of detail must indicate 10k to 100Mpix (got {0})")]
    LevelOfDetailRange(usize),
}

impl std::convert::From<(&std::path::Path, std::io::Error)> for Error {
    fn from(value: (&std::path::Path, std::io::Error)) -> Self {
        let pathname = value.0.as_os_str().to_string_lossy().into();
        Self::FailedToOpenImage(pathname, value.1)
    }
}

/// A level of detail - 0 means native
///
/// This is the number of pixels expected (really a maximum, as images are
/// rectangles with size increments >1 pixel as they grow)
///
/// In a user file they are stored as f32 in units of MPix (i.e. 1.0 is 1Mpix;
/// thumbnails might be 0.1 to allow for e.g. 320x300)
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Lod(usize);

impl std::fmt::Display for Lod {
    fn fmt(&self, fmt: &mut std::fmt::Formatter) -> std::fmt::Result {
        if self.is_unscaled() {
            write!(fmt, "unscaled")
        } else if self.0 > 1_000_000 {
            let m = self.0 / 1_000_000;
            let k = ((self.0 / 1000) - m * 1000) / 1000;
            if (k > 0) {
                write!(fmt, "{m}M{k:03}")
            } else {
                write!(fmt, "{m}M")
            }
        } else if self.0 > 1_000 {
            let k = self.0 / 1_000;
            let u = self.0 - k * 1000;
            if (u > 0) {
                write!(fmt, "{k}k{u:03}")
            } else {
                write!(fmt, "{k}k")
            }
        } else {
            write!(fmt, "{}px", self.0)
        }
    }
}
impl Lod {
    pub fn unscaled() -> Self {
        Self(0)
    }

    pub fn as_usize(self) -> usize {
        self.0
    }

    pub fn of_f32(lod: f32) -> Result<Self, Error> {
        let lod = (lod * 1_000_000.0) as usize;
        if lod < 10_000 || lod > 100_000_000 {
            Err(Error::LevelOfDetailRange(lod))
        } else {
            Ok(Self(lod))
        }
    }

    pub fn is_unscaled(self) -> bool {
        self.0 == 0
    }

    pub fn lod_wh(self, w: u32, h: u32) -> Option<(u32, u32)> {
        let w = w as f64;
        let h = h as f64;
        let num_pix = w * h;
        let aspect_ratio = w / h;
        let max_pix = self.0 as f64;
        if self.is_unscaled() {
            None
        } else if num_pix <= max_pix {
            None
        } else {
            // Get 0 < scale factor < 1
            let scale_factor = (max_pix / num_pix).sqrt();
            let mut scaled_w = (w * scale_factor / 8.0).floor() * 8.0;
            let mut scaled_h;
            loop {
                scaled_h = scaled_w / aspect_ratio;
                if (scaled_w * scaled_h) <= max_pix {
                    break;
                }
                scaled_w -= 8.0;
            }
            Some((scaled_w as u32, scaled_h as u32))
        }
    }

    pub fn image_path(self, image_src: &Path) -> Result<PathBuf, Error> {
        if self.is_unscaled() {
            Ok(image_src.into())
        } else {
            let file_stem = image_src.file_stem();
            let extension = image_src.extension();
            let lod = self.to_string();
            if file_stem.is_none() || extension.is_none() {
                Err(Error::CannotCreateOutputImagePath(image_src.to_owned()))
            } else {
                let mut file_name = file_stem.unwrap().to_owned();
                let extension = extension.unwrap();
                file_name.push("_");
                file_name.push(&lod);
                let image_path = image_src
                    .with_file_name(&file_name)
                    .with_extension(extension);
                Ok(image_path)
            }
        }
    }
}

mod album;
mod image;
mod image_data;
mod page;
mod style;

pub use album::{Album, ImageIndex, PageIndex};
pub use image::Image;
pub use image_data::ImageData;
pub use page::{Page, PageImage, PagePage};
pub use style::Style;
