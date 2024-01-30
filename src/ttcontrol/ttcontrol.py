# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Tiny Tapeout LTD

import sys
import machine
from machine import Pin

print(f"\nversion={sys.version.split(';')[1].strip()}")

# GPIO mapping for TT demo board
GPIO_PROJECT_CLK = 0
GPIO_MUX_SEL = 1
GPIO_CTRL_ENA = 6
GPIO_CTRL_RST_N = 7
GPIO_CTRL_INC = 8

GPIO_OUT = [3, 4, 7, 8, 13, 14, 15, 16]
GPIO_IN = [9, 10, 11, 12, 17, 18, 19, 20]

mux_sel = Pin(GPIO_MUX_SEL, Pin.OUT, value = 1)
ctrl_ena = Pin(GPIO_CTRL_ENA, Pin.OUT, value = 0)
ctrl_rst_n = Pin(GPIO_CTRL_RST_N, Pin.OUT, value = 1)
ctrl_inc = Pin(GPIO_CTRL_INC, Pin.OUT, value = 0)
ui_in = [Pin(pin, Pin.IN, Pin.PULL_DOWN) for pin in GPIO_IN]
uo_out = [Pin(pin, Pin.OUT) for pin in GPIO_OUT]

def read_ui_in():
    data = 0
    for i in range(8):
        data |= ui_in[i].value() << i
    return data

def write_uo_out(data):
    for i in range(8):
        uo_out[i].value(data & 1)
        data >>= 1

def select_design(design):
    mux_sel.value(0)
    ctrl_ena.value(0)
    ctrl_rst_n.value(0)
    ctrl_rst_n.value(1)
    for _ in range(design):
        ctrl_inc.value(1)
        ctrl_inc.value(0)
    ctrl_ena.value(1)
    mux_sel.value(1)
    print(f"design={design}")

def set_clock_hz(hz, max_rp2040_freq=133_000_000):
    # Only support integer frequencies
    freq = int(hz)
    print(f"freq_req={freq}")

    # Get best acheivable RP2040 clock rate for that rate
    rp2040_freq = _get_best_rp2040_freq(freq, max_rp2040_freq)
    print(f"freq_rp2040={rp2040_freq}")

    # Apply the settings
    machine.freq(rp2040_freq)
    machine.PWM(GPIO_PROJECT_CLK, freq=freq, duty_u16=0x7fff)

# ROM format documented here: https://github.com/TinyTapeout/tt-chip-rom
def read_rom():
    select_design(0)
    write_uo_out(0x00)
    magic = read_ui_in()
    if magic != 0x78: # "t" in 7-segment
        print("shuttle=unknown") # TODO: detect tt03p5
        return
    rom_data = ""
    for i in range(32, 128):
        write_uo_out(i)
        byte = read_ui_in()
        if byte == 0:
            break
        rom_data += chr(byte)
    print(rom_data)

def _get_best_rp2040_freq(freq, max_rp2040_freq):
    # Scan the allowed RP2040 frequency range for a frequency
    # that will divide to the target frequency well
    min_rp2040_freq = 48_000_000

    if freq > max_rp2040_freq // 2:
        raise ValueError("Requested frequency too high")
    if freq <= min_rp2040_freq // (2**24-1):
        raise ValueError("Requested frequency too low")

    best_freq = 0
    best_fracdiv = 2000000000
    best_div = 0

    rp2040_freq = min(max_rp2040_freq, freq * (2**24-1))
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
        if abs(int(rp2040_freq / pwm_divisor + 0.5) - freq) > abs(int(rp2040_freq / (pwm_divisor + 2) + 0.5) - freq):
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

    if best_fracdiv >= 1.0/256:
        print(f"freq_jitter_free={best_freq // best_div}")

    return best_freq
