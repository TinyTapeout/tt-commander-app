import uselect
import sys
from machine import UART

uart = UART(0, baudrate=115200, tx=tt.pins.ui_in3.raw_pin, rx=tt.pins.uo_out4.raw_pin)
poll = uselect.poll()
poll.register(sys.stdin, uselect.POLLIN)

while True:
    if poll.poll(0):
        _ = uart.write(sys.stdin.buffer.read(1))
    uart_data = uart.read()
    if uart_data:
        _ = sys.stdout.write(uart_data)
