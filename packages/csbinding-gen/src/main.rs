// Copyright (C) 2024-2025 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

use clap::Parser;
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser)]
struct Cli {
    /// Input C header file
    input: String,
    /// Output C# file
    #[arg(short, long)]
    output: String,
}

fn main() {
    let cli = Cli::parse();

    let temp_filename = format!(
        "bindgen_{}.rs",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );
    let temp_path = env::temp_dir().join(temp_filename);

    bindgen::Builder::default()
        .header(&cli.input)
        .allowlist_file(&cli.input)
        .generate()
        .expect("Unable to generate bindings")
        .write_to_file(&temp_path)
        .expect("Unable to write bindings");

    csbindgen::Builder::default()
        .input_bindgen_file(&temp_path)
        .csharp_dll_name("gitcg")
        .csharp_namespace("GiTcg")
        .csharp_class_name("NativeMethods")
        .generate_csharp_file(&cli.output)
        .expect("Unable to generate C# bindings");

    let _ = std::fs::remove_file(temp_path);
}
