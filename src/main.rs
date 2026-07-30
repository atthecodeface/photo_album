use photo_album;
use photo_album::PathSet;

use serde_yaml;

use thunderclap::{ArgCount, ArgDescriptor, CmdDescriptor, CommandArgs, json};

#[derive(Default, Debug)]
pub struct PhotoAlbumCommand {
    verbose: bool,
    pretty_json: bool,

    file_path_set: PathSet,

    read_filename: Option<String>,

    // Positional string / f64 / usize arguments
    arg_strings: Vec<String>,
    arg_f64s: Vec<f64>,
    arg_usizes: Vec<usize>,
}

impl CommandArgs for PhotoAlbumCommand {
    type Error = photo_album::Error;
    type Value = json::Value;
    const PROPERTIES: &[thunderclap::CmdProperty<'static, Self, Self::Value, Self::Error>] = &[];
    fn value_from_str(s: &str) -> Result<Self::Value, Self::Error> {
        if let Ok(v) = serde_json::from_str::<Self::Value>(s) {
            return Ok(v);
        }
        let v = serde_json::to_value(s)?;
        Ok(v)
    }
    fn cmd_ok() -> std::result::Result<Self::Value, Self::Error> {
        Ok("".into())
    }
    fn reset_args(&mut self) {
        self.read_filename = None;
        self.arg_strings.clear();
        self.arg_f64s.clear();
        self.arg_usizes.clear();
    }
}

impl PhotoAlbumCommand {
    fn if_verbose<F>(&self, f: F)
    where
        F: FnOnce(),
    {
        if self.verbose {
            f()
        }
    }
    pub fn verbose(&self) -> bool {
        self.verbose
    }
    pub fn pretty_json(&self) -> bool {
        self.pretty_json
    }

    const ARG_VERBOSE: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_flag(
        "verbose",
        Some('v'),
        "Enable verbose output",
        &|cmd: &mut PhotoAlbumCommand, verbose| {
            cmd.verbose = verbose;
            Ok(())
        },
    );

    const ARG_PRETTY_JSON: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_flag(
        "pretty_json",
        Some('p'),
        "Enable pretty JSON output",
        &|cmd: &mut PhotoAlbumCommand, pretty_json| {
            cmd.pretty_json = pretty_json;
            Ok(())
        },
    );

    const ARG_READ_FILENAME: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_string(
        "album_desc_file",
        Some('f'),
        "Album descriptor filename",
        ArgCount::Required,
        None,
        &|cmd: &mut PhotoAlbumCommand, filename| {
            cmd.read_filename = Some(filename.to_owned());
            Ok(())
        },
    );

    const ARG_CLEAR_FILE_PATH: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_flag(
        "clear_file_path",
        None,
        "Clear the file path",
        &|cmd: &mut PhotoAlbumCommand, _s| {
            cmd.file_path_set.clear();
            Ok(())
        },
    );

    const ARG_ADD_FILE_PATH: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_string(
        "file_path",
        Some('P'),
        "Add a file path to the path set",
        ArgCount::Any,
        None,
        &|cmd: &mut PhotoAlbumCommand, s| {
            cmd.file_path_set.add_path(s)?;
            Ok(())
        },
    );

    const BASE_CMD: CmdDescriptor<Self> = CmdDescriptor::new("photo_album")
        .about("Photo album creator")
        .version("0.1.0")
        .args(&[
            Self::ARG_VERBOSE,
            Self::ARG_PRETTY_JSON,
            Self::ARG_CLEAR_FILE_PATH,
            Self::ARG_ADD_FILE_PATH,
            Self::ARG_READ_FILENAME,
        ])
        .handler(&Self::main)
        .cmds(&[]);

    pub fn main(&mut self) -> Result<<Self as CommandArgs>::Value, <Self as CommandArgs>::Error> {
        let r = std::fs::File::open("temp.yaml")?;
        let x = serde_yaml::from_reader::<_, photo_album::desc::AlbumDesc>(r)?;
        let s = x.to_album(&self.file_path_set)?;
        eprintln!("{s:?}");
        Self::cmd_ok()
    }
}

pub fn main() -> Result<(), Box<dyn std::error::Error>> {
    let build = PhotoAlbumCommand::BASE_CMD.build();
    let mut cmd_args = PhotoAlbumCommand::default();
    let mut command = build.main(true, true);
    command.execute_env(&mut cmd_args)?;
    Ok(())
}
