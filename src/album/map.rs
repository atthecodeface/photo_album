use super::{ImageIndex, LatLon};

use crate::Album;

#[derive(Debug, Default)]
pub struct Map {
    /// Name of the page description, unique within the site
    name: String,
    /// Image source file, when created from an ImageDesc
    image: ImageIndex,
    /// Default caption to use for the image
    caption: String,
    /// Corners in LatLon (tl, tr, bl, br)
    corners: [LatLon; 4],
}

impl Map {
    pub fn set_name<I: Into<String>>(&mut self, name: I) {
        self.name = name.into();
    }
    pub fn set_caption<I: Into<String>>(&mut self, caption: I) {
        self.caption = caption.into();
    }
    pub fn set_image(&mut self, image: ImageIndex) {
        self.image = image;
    }
    pub fn set_ll(&mut self, corner: usize, ll: &[f64; 2]) {
        if corner < 4 {
            self.corners[corner].lat = ll[0];
            self.corners[corner].lon = ll[0];
        }
    }
    pub fn image(&self) -> ImageIndex {
        self.image
    }
    pub fn name(&self) -> &str {
        &self.name
    }
    pub fn caption(&self) -> &str {
        &self.caption
    }
    pub fn corners(&self) -> &[LatLon; 4] {
        &self.corners
    }
}
