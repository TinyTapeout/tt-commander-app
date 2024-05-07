from ttboard.demoboard import DemoBoard
from ttboard.mode import RPMode
import ttboard.logging as logging
log = logging.getLogger(__name__)

def factory_test_rom_bits(tt:DemoBoard):

    log.info(f'Testing ROM ui_in[7:0]')

    #tt.shuttle.tt_um_chip_rom.enable()
    tt.mode = RPMode.ASIC_RP_CONTROL # make sure we're controlling everything

    expected = {
        0: 0x78, # T in 7-segment
        1: 0x78, # T in 7-segment
        129: 0x0, # Empty
    }

    for input, output in expected.items():
        tt.input_byte = input
        time.sleep_ms(1)
        if tt.output_byte != output:
            log.warn(f'MISMATCH between expected byte {output} and output {tt.output_byte} at index {input}')

    rom_data = ""
    for i in range(32, 128):
        tt.input_byte = input
        time.sleep_ms(1)
        byte = tt.output_byte
        if byte == 0:
            break
        rom_data += chr(byte)
    print(f"ROM data: {rom_data}")

    assert "shuttle=" in rom_data
    assert "repo=tinytapeout/" in rom_data

    return True

tt = DemoBoard.get()
err = factory_test_rom_bits(tt)

okay = True

if err is not None:
    print(f"error=factory_test_clocking, {err}")
    okay = False


# TODO: bidir test through factory test project

if okay:
    print("factory_test=OK")
