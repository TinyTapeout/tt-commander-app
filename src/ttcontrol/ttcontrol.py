# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Tiny Tapeout LTD

import os
import sys


def report(dict_or_key: dict, val: str = None):
    if val is not None and not isinstance(dict_or_key, dict):
        dict_or_key = {dict_or_key: val}

    strs = list(map(lambda x: f"{x[0]}={x[1]}", dict_or_key.items()))
    print("\n".join(strs))


print()
report("sys.version", sys.version.split(";")[1].strip())
try:
    sdk_version = next(filter(lambda f: f.startswith("release_v"), os.listdir("/")))
except:
    sdk_version = "unknown"
report("tt.sdk_version", sdk_version)


from ttboard.demoboard import DemoBoard
from ttboard.mode import RPMode

FirstLoadDone = False

tt = DemoBoard.get()

def enable_ui_in(enabled):
    tt = DemoBoard.get()
    ac_freq = 0
    if tt.is_auto_clocking:
        ac_freq = tt.auto_clocking_freq
    if enabled:
        tt.mode = RPMode.ASIC_RP_CONTROL
    else:
        tt.mode = RPMode.ASIC_MANUAL_INPUTS

    if ac_freq:
        set_clock_hz(ac_freq)

    report("tt.mode", tt.mode_str)


def write_ui_in(data):
    DemoBoard.get().ui_in.value = data


def select_design(design):
    tt = DemoBoard.get()
    tt.apply_configs = False
    tt.mode = RPMode.ASIC_MANUAL_INPUTS

    tt.shuttle[design].enable()
    hz = 0
    if tt.is_auto_clocking:
        hz = tt.clk.freq()

    report({"tt.design": design, "tt.clk_freq": hz, "tt.mode": tt.mode_str})


def reset_project():
    tt = DemoBoard.get()
    tt.reset_project(True)
    tt.reset_project(False)

    report("tt.reset_project", 1)


def set_clock_hz(hz):
    tt = DemoBoard.get()
    if hz > 0:
        tt.clock_project_PWM(hz)
        reportfreq = tt.auto_clocking_freq
    else:
        tt.clock_project_stop()
        reportfreq = 0
    report("tt.clk_freq", reportfreq)


def manual_clock(cycles=1):
    tt = DemoBoard.get()
    if tt.is_auto_clocking:
        tt.clock_project_stop()
    for i in range(cycles):
        tt.clock_project_once()
    report("tt.clk_once", cycles)


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


def run_factory_test():
    import ttboard.util.shuttle_tests as st

    tt = DemoBoard.get()
    err = st.factory_test_clocking(tt, read_bidirs=True)
    if err is not None:
        print(f"error=factory_test_clocking, {err}")
    else:
        print("factory_test=OK")


