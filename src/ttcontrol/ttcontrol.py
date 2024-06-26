# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Tiny Tapeout LTD

import sys
import os
import rp2
import machine
from machine import Pin

print(f"\nversion={sys.version.split(';')[1].strip()}")
try:
    sdk_version = next(filter(lambda f: f.startswith("release_v"), os.listdir("/")))
except:
    sdk_version = "unknown"
print(f"sdk={sdk_version}")

# GPIO mapping for TT demo board
GPIO_PROJECT_CLK = 0
GPIO_MUX_SEL = 1
GPIO_PROJECT_RST_N = 3
GPIO_CTRL_ENA = 6
GPIO_CTRL_RST_N = 7
GPIO_CTRL_INC = 8
GPIO_UI_IN = [9, 10, 11, 12, 17, 18, 19, 20]
GPIO_UIO = [21, 22, 23, 24, 25, 26, 27, 28]

MUX_SEL_CTRL = 0
MUX_SEL_OU_OUT = 1

clk_pin = Pin(GPIO_PROJECT_CLK, Pin.IN, Pin.PULL_DOWN)
proj_rst_n = Pin(GPIO_PROJECT_RST_N, Pin.IN, Pin.PULL_UP)
mux_sel = Pin(GPIO_MUX_SEL, Pin.OUT, value=1)
ctrl_ena = Pin(GPIO_CTRL_ENA, Pin.OUT, value=0)
ctrl_rst_n = Pin(GPIO_CTRL_RST_N, Pin.IN)  # Pulled-up by PCB
ctrl_inc = Pin(GPIO_CTRL_INC, Pin.IN)  # Pulled-down by PCB
ui_in = [Pin(pin, Pin.IN, Pin.PULL_DOWN) for pin in GPIO_UI_IN]
uio = [Pin(pin, Pin.IN, Pin.PULL_DOWN) for pin in GPIO_UIO]
current_pwm = None
current_pio = None


# Some of the ou_out pins are multiplexed with the ctrl pins, so special care needed
_p = lambda pin: Pin(pin, Pin.IN, Pin.PULL_DOWN)
uo_out = [_p(5), ctrl_ena, ctrl_rst_n, ctrl_inc, _p(13), _p(14), _p(15), _p(16)]


def read_uo_out():
    data = 0
    for i in range(8):
        data |= uo_out[i].value() << i
    return data


def enable_ui_in(enabled):
    for pin in ui_in:
        pin.init(Pin.OUT if enabled else Pin.IN, Pin.PULL_DOWN)


def write_ui_in(data):
    for i in range(8):
        ui_in[i].value(data & 1)
        data >>= 1


def select_design(design):
    mux_sel.value(MUX_SEL_CTRL)
    ctrl_ena.value(0)
    ctrl_inc.init(Pin.OUT, value=0)
    ctrl_rst_n.init(Pin.OUT, value=0)  # reset ctrl
    ctrl_rst_n.value(1)
    for _ in range(design):
        ctrl_inc.value(1)
        ctrl_inc.value(0)
    ctrl_ena.value(1)
    ctrl_ena.init(Pin.IN)
    ctrl_inc.init(Pin.IN)
    ctrl_rst_n.init(Pin.IN)
    mux_sel.value(MUX_SEL_OU_OUT)
    print(f"design={design}")


def reset_project():
    mux_sel.value(MUX_SEL_OU_OUT)
    proj_rst_n.init(Pin.OUT, value=0)
    proj_rst_n.init(Pin.IN, Pin.PULL_UP)
    print("reset_project=1")


def set_clock_hz(hz, max_rp2040_freq=133_000_000):
    global current_pwm, current_pio

    # Only support integer frequencies
    freq = int(hz)
    print(f"freq_req={freq}")

    if hz < 3:
        if current_pwm:
            current_pwm.deinit()
            current_pwm = None
        if hz > 0:
            _generate_pio_clock(hz)
        else:
            _stop_pio_clock()
            clk_pin.init(Pin.IN, Pin.PULL_DOWN)
        return

    _stop_pio_clock()

    # Get best acheivable RP2040 clock rate for that rate
    rp2040_freq = _get_best_rp2040_freq(freq, max_rp2040_freq)
    print(f"freq_rp2040={rp2040_freq}")

    # Apply the settings
    machine.freq(rp2040_freq)
    current_pwm = machine.PWM(GPIO_PROJECT_CLK, freq=freq, duty_u16=0x7FFF)


def manual_clock(cycles=1):
    global current_pwm
    if current_pwm:
        current_pwm.deinit()
        current_pwm = None

    for _ in range(cycles):
        clk_pin.init(Pin.OUT, value=1)
        clk_pin.init(Pin.OUT, value=0)
    clk_pin.init(Pin.IN, Pin.PULL_DOWN)

    print(f"clock_project={cycles}")


# ROM format documented here: https://github.com/TinyTapeout/tt-chip-rom
def read_rom():
    try:
        select_design(0)
        enable_ui_in(True)
        write_ui_in(0x00)
        magic = read_uo_out()
        if magic != 0x78:  # "t" in 7-segment
            try:
                with open("rom_fallback.txt", "r") as f:
                    print(f.read())
            except:
                print("shuttle=unknown")
            return
        rom_data = ""
        for i in range(32, 128):
            write_ui_in(i)
            byte = read_uo_out()
            if byte == 0:
                break
            rom_data += chr(byte)
        print(rom_data)
    finally:
        enable_ui_in(False)


def write_config(default_project, clock):
    config_content = f"[DEFAULT]\nproject={default_project}\n[{default_project}]\nclock_frequency={clock}\n"
    with open("config.ini", "w") as f:
        f.write(config_content)
    for line in config_content.split("\n"):
        print("config_line=", line)


@rp2.asm_pio(set_init=rp2.PIO.OUT_HIGH)
def _pio_toggle_pin():
    wrap_target()
    set(pins, 1)
    mov(y, osr)
    label("delay1")
    jmp(y_dec, "delay1")  # Delay
    set(pins, 0)
    mov(y, osr)
    label("delay2")
    jmp(y_dec, "delay2")  # Delay
    wrap()


def _generate_pio_clock(hz: int):
    global current_pio
    machine.freq(100_000_000)
    if not current_pio:
        current_pio = rp2.StateMachine(
            0,
            _pio_toggle_pin,
            freq=2000,
            set_base=Pin(GPIO_PROJECT_CLK),
        )
    # Set the delay: 1000 cycles per hz minus 2 cycles for the set/mov instructions
    current_pio.put(int(500 * (2 / hz) - 2))
    current_pio.exec("pull()")
    current_pio.active(1)


def _stop_pio_clock():
    global current_pio
    if current_pio:
        current_pio.active(0)
    current_pio = None


def _get_best_rp2040_freq(freq, max_rp2040_freq):
    # Scan the allowed RP2040 frequency range for a frequency
    # that will divide to the target frequency well
    min_rp2040_freq = 48_000_000

    if freq > max_rp2040_freq // 2:
        raise ValueError("Requested frequency too high")
    if freq <= min_rp2040_freq // (2**24 - 1):
        raise ValueError("Requested frequency too low")

    best_freq = 0
    best_fracdiv = 2000000000
    best_div = 0

    rp2040_freq = min(max_rp2040_freq, freq * (2**24 - 1))
    if rp2040_freq > 136_000_000:
        rp2040_freq = (rp2040_freq // 2_000_000) * 2_000_000
    else:
        rp2040_freq = (rp2040_freq // 1_000_000) * 1_000_000

    while rp2040_freq >= 48_000_000 and rp2040_freq >= 1.9 * freq:
        next_rp2040_freq = rp2040_freq - 1_000_000
        if next_rp2040_freq > 136_000_000:
            next_rp2040_freq = rp2040_freq - 2_000_000

        # Work out the closest multiple of 2 divisor that could be used
        pwm_divisor = max((rp2040_freq // (2 * freq)) * 2, 2)
        if abs(int(rp2040_freq / pwm_divisor + 0.5) - freq) > abs(
            int(rp2040_freq / (pwm_divisor + 2) + 0.5) - freq
        ):
            pwm_divisor += 2

        # Check if the target freq will be acheived
        fracdiv = abs(rp2040_freq / freq - pwm_divisor)
        if freq == rp2040_freq // pwm_divisor:
            return rp2040_freq
        elif fracdiv < best_fracdiv:
            best_fracdiv = fracdiv
            best_freq = rp2040_freq
            best_div = pwm_divisor

        rp2040_freq = next_rp2040_freq

    if best_fracdiv >= 1.0 / 256:
        print(f"freq_jitter_free={best_freq // best_div}")

    return best_freq
