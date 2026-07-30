use std::path::Path;
use std::str::FromStr;
use std::{collections::HashMap, path::PathBuf};

use super::{Error, Image, Page};
use crate::PathSet;

#[derive(Debug, Default)]
pub struct Album {
    path_set: PathSet,
    /// Source directories for the images
    image_srcs: Vec<PathBuf>,
    images: Vec<Image>,
    pages: Vec<Page>,
    lod: Vec<usize>,
    page_index: HashMap<String, usize>,
    image_index: HashMap<String, usize>,
}

impl Album {
    pub fn new(path_set: &PathSet) -> Self {
        let mut s = Self::default();
        s.path_set = path_set.clone();
        s
    }
    pub fn add_lod(&mut self, lod: f32) -> Result<(), Error> {
        let lod = (lod * 1_000_000.0) as usize;
        if lod < 10_000 || lod > 100_000_000 {
            return Err(Error::LevelOfDetailRange(lod));
        }
        self.lod.push(lod);
        self.lod.sort();
        Ok(())
    }
    pub fn find_image_path<P: AsRef<Path>>(&self, path: P) -> Result<PathBuf, Error> {
        Ok(self.path_set.find_file_err(path)?)
    }
    pub fn add_image_src(&mut self, s: &str) -> Result<(), Error> {
        let p = PathBuf::from_str(s).unwrap(); // The conversion is infallible
        self.image_srcs.push(p);
        Ok(())
    }

    pub fn add_image(&mut self, img: Image) -> Result<(), Error> {
        eprintln!("Add image {}", img.name());
        let n = self.images.len();
        let name = img.name().to_owned();
        self.images.push(img);
        self.image_index.insert(name, n);
        Ok(())
    }

    pub fn add_page(&mut self, page: Page) -> Result<(), Error> {
        let n = self.pages.len();
        let name = page.name().to_owned();
        self.pages.push(page);
        self.page_index.insert(name, n);
        Ok(())
    }

    pub fn find_image_index(&self, image_name: &str) -> Result<usize, Error> {
        if let Some(idx) = self.image_index.get(image_name) {
            Ok(*idx)
        } else {
            Err(Error::AlbumDoesNotContainImage {
                image_name: image_name.to_owned(),
            })
        }
    }
    pub fn image(&self, idx: usize) -> Option<&Image> {
        self.images.get(idx)
    }

    pub fn find_page_index(&self, page_name: &str) -> Result<usize, Error> {
        eprintln!("Find page {page_name}");
        if let Some(idx) = self.page_index.get(page_name) {
            Ok(*idx)
        } else {
            Err(Error::AlbumDoesNotContainPage {
                page_name: page_name.to_owned(),
            })
        }
    }

    pub fn page(&self, idx: usize) -> Option<&Page> {
        self.pages.get(idx)
    }

    pub fn make_page_indexes(&self) {
        for p in self.pages.iter() {
            p.make_page_index(&self);
        }
    }
}
