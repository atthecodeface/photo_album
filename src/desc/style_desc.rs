use serde::{Deserialize, Serialize};

use crate::album::Style;

use super::Error;

/// Style descriptor
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct StyleDesc {
    #[serde(default)]
    x: u32,
    #[serde(default)]
    y: u32,
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
    #[serde(default)]
    pad: Option<usize>,
    #[serde(default)]
    bg: Option<String>,
    #[serde(default)]
    color: Option<String>,
    #[serde(default)]
    border: Option<String>,
    #[serde(default)]
    font: Option<String>,
}

impl StyleDesc {
    pub fn to_style(self) -> Result<Style, Error> {
        let s = Style::default()
            .with_x(self.x)
            .with_y(self.y)
            .with_width(self.width)
            .with_height(self.height)
            .with_num_cols(self.num_cols)
            .with_num_rows(self.num_rows)
            .with_lod(self.lod)
            .with_pad(self.pad)
            .with_bg(self.bg)
            .with_color(self.color)
            .with_border(self.border)
            .with_font(self.font);
        Ok(s)
    }
}
