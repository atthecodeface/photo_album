use serde::{Deserialize, Serialize};

use crate::album::{Album, Map};

use super::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct MapDesc {
    /// Name of the map description, unique within the site
    name: String,
    /// Image name to use for the map
    image: String,
    /// Default caption to use for the map
    caption: String,
    /// Corners as 8 f64 (4 lat-lon pairs); tl, tr, bl, br
    ///
    /// Or as 4 f64 (left lat, right lat, top lon, bottom lon)
    corners: Vec<f64>,
}

impl MapDesc {
    pub fn to_map(self, album: &mut Album) -> Result<Map, Error> {
        let mut map = Map::default();
        map.set_name(self.name);
        map.set_caption(self.caption);
        map.set_image(album.find_image_index(&self.image)?);
        if self.corners.len() == 8 {
            map.set_ll(0, &self.corners.as_chunks::<2>().0[0]);
            map.set_ll(1, &self.corners.as_chunks::<2>().0[1]);
            map.set_ll(2, &self.corners.as_chunks::<2>().0[2]);
            map.set_ll(3, &self.corners.as_chunks::<2>().0[3]);
        } else if self.corners.len() == 4 {
            map.set_ll(0, &[self.corners[0], self.corners[2]]);
            map.set_ll(1, &[self.corners[1], self.corners[2]]);
            map.set_ll(2, &[self.corners[0], self.corners[3]]);
            map.set_ll(3, &[self.corners[1], self.corners[3]]);
        } else {
            return Err(Error::BadMapCorners(map.name().to_owned()));
        }
        Ok(map)
    }
}
