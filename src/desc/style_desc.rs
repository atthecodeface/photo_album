use serde::{Deserialize, Serialize};

use crate::album::Style;

use super::Error;

/// Style descriptor
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct StyleDesc {
    #[serde(default)]
    bg: String,
    #[serde(default)]
    color: String,
    #[serde(default)]
    width: u32,
    #[serde(default)]
    height: u32,
    #[serde(default)]
    num_rows: usize,
    #[serde(default)]
    num_cols: usize,
    #[serde(default)]
    lod: usize,
    // FIXME
    #[serde(default)]
    rc: (u32, u32),
    #[serde(default)]
    pad: usize,
    #[serde(default)]
    border: usize,
    #[serde(default)]
    margin: usize,
}

impl StyleDesc {
    pub fn to_style(self) -> Result<Style, Error> {
        let mut s = Style::default();
        s.x = self.rc.0;
        s.y = self.rc.1;
        s.bg = self.bg;
        s.color = self.color;
        s.width = self.width;
        s.height = self.height;
        s.lod = self.lod;
        s.num_rows = self.num_rows;
        s.num_cols = self.num_cols;
        Ok(s)
    }

    pub fn w_px(&self, aspect_ratio: f32) -> u32 {
        if self.width > 0 {
            self.width
        } else {
            (self.height as f32 * aspect_ratio) as u32
        }
    }
    pub fn h_px(&self, aspect_ratio: f32) -> u32 {
        if self.height > 0 {
            self.height
        } else {
            (self.width as f32 / aspect_ratio) as u32
        }
    }
}
