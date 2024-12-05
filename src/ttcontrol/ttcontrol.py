# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Tiny Tapeout LTD

import os
import sys
import machine

_tt_timers = dict()


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

tt = DemoBoard.get()


def enable_ui_in(enabled):
    tt = DemoBoard.get()
    ac_freq = 0
    if tt.is_auto_clocking:
        ac_freq = tt.auto_clocking_freq
    if enabled:
        tt.mode = RPMode.ASIC_RP_CONTROL
        stop_monitoring(tt.ui_in)
    else:
        tt.mode = RPMode.ASIC_MANUAL_INPUTS
        start_monitoring(tt.ui_in, 10)

    if ac_freq:
        set_clock_hz(ac_freq)

    report("tt.mode", tt.mode_str)


def write_ui_in(data):
    DemoBoard.get().ui_in.value = data


def monitor_uo_out(frequency=10):
    if frequency > 0:
        start_monitoring(DemoBoard.get().uo_out, frequency)
    else:
        stop_monitoring(DemoBoard.get().uo_out)


def dump_state():
    global _tt_timers
    tt = DemoBoard.get()
    design = 0
    if tt.shuttle.enabled is not None:
        design = tt.shuttle.enabled.project_index

    hz = tt.auto_clocking_freq
    vals = {
        "tt.design": design,
        "tt.clk_freq": hz,
        "tt.mode": tt.mode_str,
        "monitor": ",".join(_tt_timers.keys()),
    }
    for io in [tt.ui_in, tt.uo_out, tt.uio_in]:
        vals[f"tt.{io.port.name}"] = int(io.value)

    report(vals)


def select_design(design, clock_hz=None):
    tt = DemoBoard.get()
    tt.apply_configs = False
    tt.mode = RPMode.ASIC_MANUAL_INPUTS

    tt.shuttle[design].enable()
    if clock_hz is not None:
        set_clock_hz(clock_hz)
    dump_state()


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


def start_monitoring(io, frequency):
    global _tt_timers
    name = io.port.name
    if name in _tt_timers:
        if _tt_timers[name]["freq"] == frequency:
            # already good
            return
        _tt_timers[name]["timer"].deinit()

    _tt_timers[name] = {"timer": machine.Timer(), "value": 0, "freq": frequency}

    def cb(t):
        v = int(io.value)
        timer = _tt_timers.get(name)
        if timer is None:
            t.deinit()
            return
        if v != timer["value"]:
            timer["value"] = v
            print("")  # ensure we're on a new line
            report(f"tt.{name}", v)

    _tt_timers[name]["timer"].init(mode=machine.Timer.PERIODIC, freq=frequency, callback=cb)


def stop_monitoring(io):
    global _tt_timers
    name = io.port.name
    if name not in _tt_timers:
        return

    _tt_timers[name]["timer"].deinit()
    del _tt_timers[name]


def stop_all_monitoring():
    global _tt_timers
    tt = DemoBoard.get()
    for name in _tt_timers.keys():
        stop_monitoring(getattr(tt, name))
