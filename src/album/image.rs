use std::path::{Path, PathBuf};

use image::{ImageReader, RgbImage};

use super::{Error, ImageData, Lod};

use crate::Album;

#[derive(Debug, Default)]
pub struct Image {
    /// Name of the page description, unique within the site
    name: String,
    /// Image source file, when created from an ImageDesc
    src: PathBuf,
    /// Default caption to use for the image
    caption: String,
    /// Image data, sorted by lod
    ///
    /// So native is at [0]; then thumbnail to largest
    image_data: Vec<ImageData>,
    /// Timestamp (seconds since epoch) of image
    timestamp: u64,
    /// Latitude
    lat: f64,
    /// Longitude
    lon: f64,
    /// Direction of photo (possibly)
    dir: f32,
}

impl Image {
    pub fn read_img(&self) -> Result<RgbImage, Error> {
        let img = ImageReader::open(&self.src).map_err(|e| Error::from((self.src.as_path(), e)))?;
        let img = img.decode()?.into_rgb8();
        Ok(img)
    }
    pub fn read_img_dims(&self) -> Result<(u32, u32), Error> {
        let img = ImageReader::open(&self.src).map_err(|e| Error::from((self.src.as_path(), e)))?;
        let dims = img.into_dimensions()?;
        Ok(dims)
    }
    pub fn set_name<I: Into<String>>(&mut self, name: I) {
        self.name = name.into();
    }
    pub fn set_caption<I: Into<String>>(&mut self, caption: I) {
        self.caption = caption.into();
    }
    pub fn set_src(&mut self, album: &mut Album, path: &str) -> Result<(), Error> {
        let p = album.find_image_path(path)?;
        self.src = p
            .canonicalize()
            .map_err(|_| Error::CannotFindFile(p.clone()))?;
        let dims = self.read_img_dims()?;
        self.image_data = vec![ImageData::of_img(dims)];
        Ok(())
    }
    pub fn src(&self) -> &Path {
        self.src.as_path()
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
    pub fn timestamp(&self) -> u64 {
        self.timestamp
    }
    pub fn lat(&self) -> f64 {
        self.lat
    }
    pub fn lon(&self) -> f64 {
        self.lon
    }
    pub fn direction(&self) -> f32 {
        self.dir
    }
    pub fn name(&self) -> &str {
        &self.name
    }
    pub fn caption(&self) -> &str {
        &self.caption
    }
    pub fn add_lod(&mut self, lod: Lod) -> bool {
        let Some(image_data) = self.image_data[0].at_lod(lod) else {
            return false;
        };
        self.image_data.push(image_data);
        self.image_data.sort_by(|a, b| a.lod().cmp(&b.lod()));
        true
    }

    /// Find the ImageData that has an LOD that matches or the next higher LOD if that is not present
    ///
    /// Normally one would only look for an LOD that has been 'add'ed, so this should find that LOD.
    ///
    /// However, if one has not added a 3Mpix LOD but it is requested, and we have stored a native
    /// 100Mpix, a thumbnail at 1Mpix, and an intermediate at 10Mpix then this
    /// would return the 10Mpix; if one asked for a 20Mpix image it would return the 100Mpix (native) image.
    ///
    /// If there is no image available that has the required number of pixels then the native image is returned
    pub fn find_lod(&self, lod: Lod) -> (usize, Lod) {
        let idx = {
            if lod.is_unscaled() {
                0
            } else {
                self.image_data
                    .iter()
                    .enumerate()
                    .position(|(_, id)| id.lod() >= lod)
                    .unwrap_or(0)
            }
        };
        (idx, self.image_data[idx].lod())
    }

    pub fn image_data_of_lod(&self, lod: Lod) -> &ImageData {
        let (idx, _) = self.find_lod(lod);
        &self.image_data[idx]
    }

    pub fn image_data(&self) -> &[ImageData] {
        &self.image_data
    }
    pub fn image_data_mut(&mut self) -> &mut [ImageData] {
        &mut self.image_data
    }
}
