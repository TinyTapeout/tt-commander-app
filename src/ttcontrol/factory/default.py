import time

import ttboard.logging as logging
from ttboard.demoboard import DemoBoard
from ttboard.mode import RPMode
import ttboard.util.shuttle_tests as st

log = logging.getLogger(__name__)


def factory_test_rom_data(tt: DemoBoard):

    log.info(f"Testing ROM ui_in[7:0]")

    tt.shuttle.reset_and_clock_mux(0)  # Switch to ROM project (index = 0)
    tt.mode = RPMode.ASIC_RP_CONTROL  # make sure we're controlling everything

    expected = {
        0: 0x78,  # T in 7-segment
        1: 0x78,  # T in 7-segment
        129: 0x0,  # Empty
    }

    for input, output in expected.items():
        tt.input_byte = input
        time.sleep_ms(1)
        if tt.output_byte != output:
            return f"MISMATCH between expected byte {output} and output {tt.output_byte} at index {input}"

    rom_data = ""
    for input in range(32, 128):
        tt.input_byte = input
        time.sleep_ms(1)
        byte = tt.output_byte
        if byte == 0:
            break
        rom_data += chr(byte)
    print(f"ROM data: {rom_data}")

    if "shuttle=" not in rom_data:
        return "ROM data does not contain shuttle information"
    if "repo=tinytapeout/" not in rom_data.lower():
        return "ROM data does not contain repo information"

    return None


tt = DemoBoard.get()
okay = True


err = factory_test_rom_data(tt)
if err is not None:
    print(f"error=factory_test_rom_data, {err}")
    okay = False

if okay:
    err = st.factory_test_clocking(tt, read_bidirs=True)
    if err is not None:
        print(f"error=factory_test_clocking, {err}")
        okay = False

if okay:
    print("factory_test=OK")
