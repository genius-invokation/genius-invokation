# Copyright (C) 2024-2025 Guyutongxue
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from hatchling.builders.hooks.plugin.interface import BuildHookInterface
import re
import os
import shutil
from pathlib import Path
from cffi import FFI

ROOT_PATH = Path(__file__).parent.parent
CBINDING_PATH = (
    ROOT_PATH / "cbinding"
    if os.getenv("CI")
    else ROOT_PATH.parent / "cbinding" / "install"
)
SRC_PATH = ROOT_PATH / "src" / "gitcg"
DIST_PATH = ROOT_PATH / "dist"


def compile_cffi():
    ffi = FFI()
    header = CBINDING_PATH / "include" / "gitcg" / "gitcg.h"
    declarations = header.read_text()
    _, declarations = declarations.split("// >>> API declarations")
    declarations, _ = declarations.split("// <<< API declarations")
    declarations = re.sub(r"\bGITCG_API\b", "", declarations)
    declarations = re.sub(r"#define GITCG_CORE_VERSION \"[^\"]+\"", "", declarations)
    ffi.cdef(declarations)
    ffi.set_source("_gitcg_cffi", None)  # type: ignore
    ffi.compile(tmpdir=str(SRC_PATH), verbose=True)


def copy_lib_file():
    LIB_FILE = [
        "lib/libgitcg.so",
        "lib/libgitcg.dylib",
        "bin/gitcg.dll",
    ]
    for lib_file in LIB_FILE:
        lib_path = CBINDING_PATH / lib_file
        if lib_path.is_file():
            shutil.copy(lib_path, SRC_PATH)


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        compile_cffi()
        copy_lib_file()
