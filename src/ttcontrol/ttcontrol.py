# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Tiny Tapeout LTD

import sys

print(f"\nversion={sys.version.split(';')[1].strip()}")

def select_design(design):
   print(f"TODO: SELECT A DESIGN")
   print(f"design={design}")

def set_clock_hz(hz):
    print(f"TODO: SET CLOCK HZ")
    print(f"hz={hz}")

# ROM format documented here: https://github.com/TinyTapeout/tt-chip-rom
def read_rom():
    select_design(0)
    print("TODO: read ROM")
    # Mock data
    print("shuttle=tt05")
    print("repo=TinyTapeout/tinytapeout-04")
    print("commit=a1b2c3d4")
    # TODO: if we have a ROM, read it and print it out
    # TODO: if we don't have a ROM (tt03p5), read the ROM data "rom.txt" and print it out
