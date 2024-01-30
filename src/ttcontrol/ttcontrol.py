# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Tiny Tapeout LTD

import sys
import machine
import math

print(f"\nversion={sys.version.split(';')[1].strip()}")


# GPIO mapping for TT demo board
GPIO_PROJECT_CLK = 0
# TODO: Add other relevant GPIOs


def select_design(design):
   print(f"TODO: SELECT A DESIGN")
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
    print("TODO: read ROM")
    # Mock data
    print("shuttle=tt05")
    print("repo=TinyTapeout/tinytapeout-04")
    print("commit=a1b2c3d4")
    # TODO: if we have a ROM, read it and print it out
    # TODO: if we don't have a ROM (tt03p5), read the ROM data "rom.txt" and print it out


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
