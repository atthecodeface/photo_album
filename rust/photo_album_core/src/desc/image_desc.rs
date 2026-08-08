use serde::{Deserialize, Serialize};

use crate::album::{Album, Image};

use super::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageDesc {
    /// Name of the image description, unique within the site
    name: String,
    /// Image source file
    src: String,
    /// Default caption to use for the image
    caption: String,
}

impl ImageDesc {
    pub fn to_image(self, album: &mut Album) -> Result<Image, Error> {
        let mut img = Image::default();
        img.set_name(self.name);
        img.set_caption(self.caption);
        img.set_src(album, &self.src)?;
        Ok(img)
    }
}
