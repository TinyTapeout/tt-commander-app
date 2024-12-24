# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2024, Uri Shaked

from ttboard.demoboard import DemoBoard
from ttboard.mode import RPMode
from machine import SoftSPI
import binascii
import time


class SPIFlash:
    PAGE_SIZE = const(256)

    def __init__(self, tt):
        self.tt = tt
        self.spi = SoftSPI(
            sck=tt.bidirs[7].raw_pin,
            mosi=tt.bidirs[1].raw_pin,
            miso=tt.bidirs[2].raw_pin,
        )
        self.spi.init(baudrate=1_000_000, polarity=1, phase=1)
        self.cs = tt.bidirs[6].raw_pin
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

    def program_base64(self, address, data_b64, verify=True):
        data = binascii.a2b_base64(data_b64)
        self.program(address, data)
        if verify:
            read_data = self.read_data(address, len(data))
            if read_data != data:
                raise RuntimeError("Verification failed")
        print(f"flash_prog={hex(address)}")

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
