# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Tiny Tapeout LTD

import sys
import os


def report(dictOrKey: dict, val: str = None):
    if val is not None and not isinstance(dictOrKey, dict):
        dictOrKey = {dictOrKey: val}

    strs = list(map(lambda x: f"{x[0]}={x[1]}", dictOrKey.items()))
    print("\n".join(strs))


print()
report("version", sys.version.split(";")[1].strip())
try:
    sdk_version = next(filter(lambda f: f.startswith("release_v"), os.listdir("/")))
except:
    sdk_version = "unknown"
report("sdk", sdk_version)


from ttboard.demoboard import DemoBoard
from ttboard.mode import RPMode


def read_uo_out():
    return DemoBoard.get().output_byte


def enable_ui_in(enabled):
    tt = DemoBoard.get()
    if enabled:
        tt.mode = RPMode.ASIC_RP_CONTROL
    else:
        tt.mode = RPMode.ASIC_MANUAL_INPUTS

    report("mode", tt.mode_str)


def write_ui_in(data):
    DemoBoard.get().input_byte = data


def select_design(design):
    tt = DemoBoard.get()
    tt.shuttle[design].enable()
    hz = 0
    if tt.is_auto_clocking:
        hz = tt.project_clk.freq()

    report({"design": design, "frequency": hz, "mode": tt.mode_str})


def reset_project():
    tt = DemoBoard.get()
    tt.reset_project(True)
    tt.reset_project(False)

    report("reset_project", 1)


def set_clock_hz(hz):
    tt = DemoBoard.get()
    if hz > 0:
        tt.clock_project_PWM(hz)
        reportfreq = tt.auto_clocking_freq
    else:
        tt.clock_project_stop()
        reportfreq = 0
    report("frequency", reportfreq)


def manual_clock(cycles=1):
    tt = DemoBoard.get()
    if tt.is_auto_clocking:
        tt.clock_project_stop()
    for i in range(cycles):
        tt.clock_project_once()
    report("clock_project", cycles)


# ROM format documented here: https://github.com/TinyTapeout/tt-chip-rom
def read_rom():
    tt = DemoBoard.get()
    shuttle = tt.chip_ROM.shuttle
    if shuttle is None or not len(shuttle):
        shuttle = "unknown"

    if hasattr(tt.chip_ROM, "contents"):
        report(tt.chip_ROM.contents)
    else:
        report({"shuttle": shuttle, "repo": "SHUTTLE OVERRIDE"})
