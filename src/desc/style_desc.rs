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
    w_px: usize,
    #[serde(default)]
    h_px: usize,
    #[serde(default)]
    num_rows: usize,
    #[serde(default)]
    num_cols: usize,
    #[serde(default)]
    rc: (usize, usize),
    #[serde(default)]
    pad: usize,
    #[serde(default)]
    border: usize,
    #[serde(default)]
    margin: usize,
}

impl StyleDesc {
    pub fn to_style(self) -> Result<Style, Error> {
        let s = Style::default();
        Ok(s)
    }

    pub fn w_px(&self, aspect_ratio: f32) -> usize {
        if self.w_px > 0 {
            self.w_px
        } else {
            (self.h_px as f32 * aspect_ratio) as usize
        }
    }
    pub fn h_px(&self, aspect_ratio: f32) -> usize {
        if self.h_px > 0 {
            self.h_px
        } else {
            (self.w_px as f32 / aspect_ratio) as usize
        }
    }
}
