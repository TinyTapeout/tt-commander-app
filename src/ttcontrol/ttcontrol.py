# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Tiny Tapeout LTD

import sys
import os
import rp2
import machine
from machine import Pin

from ttboard.demoboard import DemoBoard, Pins

print(f"\nversion={sys.version.split(';')[1].strip()}")
try:
    sdk_version = next(filter(lambda f: f.startswith("release_v"), os.listdir("/")))
except:
    sdk_version = "unknown"
print(f"sdk={sdk_version}")



def read_uo_out():
    return DemoBoard.get().output_byte



def enable_ui_in(enabled):
    pass


def write_ui_in(data):
    DemoBoard.get().input_byte = data


def select_design(design):
    DemoBoard.get().shuttle[design].enable()
    print(f"design={design}")


def reset_project():
    tt = DemoBoard.get()
    tt.reset_project(True)
    tt.reset_project(False)
    
    print("reset_project=1")


def set_clock_hz(hz, max_rp2040_freq=133_000_000):
    tt = DemoBoard.get()
    tt.clock_project_PWM(hz)
    print(f"freq_rp2040={tt.project_clk.freq()}")


def manual_clock(cycles=1):
    tt = DemoBoard.get()
    if tt.is_auto_clocking:
        tt.clock_project_stop()
    for i in range(cycles):
        tt.clock_project_once()
    print(f"clock_project={cycles}")


# ROM format documented here: https://github.com/TinyTapeout/tt-chip-rom
def read_rom():
    shuttle = tt.chip_ROM.shuttle
    if shuttle is None or not len(shuttle):
        print("shuttle=unknown")
    else:
        print(f"shuttle={shuttle}")
    


def write_config(default_project, clock):
    config_content = f"[DEFAULT]\nproject={default_project}\n[{default_project}]\nclock_frequency={clock}\n"
    with open("config.ini", "w") as f:
        f.write(config_content)
    for line in config_content.split("\n"):
        print("config_line=", line)

