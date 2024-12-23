# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Uri Shaked

import binascii
import gc
import sys
import time

import micropython
from machine import SoftSPI
from ttboard.demoboard import DemoBoard
from ttboard.mode import RPMode


class SPIFlash:
    PAGE_SIZE = micropython.const(256)

    def __init__(self, tt):
        self.tt = tt
        self.spi = SoftSPI(
            sck=tt.pins.uio3.raw_pin,
            mosi=tt.pins.uio1.raw_pin,
            miso=tt.pins.uio2.raw_pin,
        )
        self.spi.init(baudrate=8_000_000, polarity=1, phase=1)
        self.cs = tt.pins.uio0.raw_pin
        self.cs.init(self.cs.OUT, value=1)

    def read_status(self):
        self.cs(0)
        try:
            self.spi.write(b"\x05")  # 'Read Status Register-1' command
            return self.spi.read(1, 0xFF)[0]
        finally:
            self.cs(1)

    def wait_not_busy(self, timeout=10000):
        while self.read_status() & 0x1:
            if timeout == 0:
                raise RuntimeError("Timed out while waiting for flash device")
            timeout -= 1
            time.sleep_us(1)
            pass

    def identify(self):
        self.wait_not_busy()
        self.cs(0)
        try:
            self.spi.write(b"\x9F")
            return self.spi.read(3, 0x00)
        finally:
            self.cs(1)

    def write_enable(self):
        self.wait_not_busy()
        self.cs(0)
        try:
            self.spi.write(b"\x06")
        finally:
            self.cs(1)

    def erase_sector(self, address):
        self.wait_not_busy()
        self.write_enable()
        self.cs(0)
        try:
            self.spi.write(b"\x20" + address.to_bytes(3, "big"))
        finally:
            self.cs(1)

    def program_page(self, address, data):
        self.wait_not_busy()
        self.write_enable()
        self.cs(0)
        try:
            self.spi.write(b"\x02" + address.to_bytes(3, "big") + data)
        finally:
            self.cs(1)

    def program(self, address, data):
        offset = 0
        while offset < len(data):
            page_address = (address + offset) & ~(self.PAGE_SIZE - 1)
            page_offset = (address + offset) % self.PAGE_SIZE
            chunk_size = min(self.PAGE_SIZE - page_offset, len(data) - offset)
            chunk = data[offset : offset + chunk_size]
            self.program_page(page_address + page_offset, chunk)
            offset += chunk_size

    def program_sectors(self, start_address, verify=True):
        addr = start_address
        print(f"flash_prog={addr:X}")
        gc.collect()
        try:
            micropython.kbd_intr(-1)  # Disable Ctrl-C
            while True:
                line = sys.stdin.buffer.readline()
                if not line:
                    break
                chunk_length = int(line.strip())
                if chunk_length == 0:
                    break
                chunk_data = sys.stdin.buffer.read(chunk_length)
                end_address = addr + len(chunk_data)
                for erase_addr in range(addr, end_address, self.PAGE_SIZE):
                    self.erase_sector(erase_addr)
                self.program(addr, chunk_data)
                if verify:
                    read_back_data = self.read_data(addr, len(chunk_data))
                    if read_back_data != chunk_data:
                        raise RuntimeError("Verification failed")
                addr += len(chunk_data)
                print(f"flash_prog={addr:X}")
        finally:
            micropython.kbd_intr(3)
        print(f"flash_prog=ok")

    def read_data(self, address, length):
        self.wait_not_busy()
        self.cs(0)
        try:
            self.spi.write(b"\x03" + address.to_bytes(3, "big"))
            return self.spi.read(length)
        finally:
            self.cs(1)


tt = DemoBoard.get()
tt.mode = RPMode.ASIC_RP_CONTROL
tt.shuttle.tt_um_chip_rom.enable()
flash = SPIFlash(tt)
print(f"flash_id={binascii.hexlify(flash.identify()).decode()}")
