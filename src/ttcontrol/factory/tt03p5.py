from ttboard.demoboard import DemoBoard
import ttboard.util.shuttle_tests as st

tt = DemoBoard.get()

err = st.factory_test_bidirs(tt)
okay = True

if err is not None:
    print(f"error=factory_test_bidirs, {err}")
    okay = False

err = st.factory_test_clocking(tt)
if err is not None:
    print(f"error=factory_test_clocking, {err}")
    okay = False

if okay:
    print("factory_test=OK")
    with open("rom_fallback.txt", "w") as f:
        f.write("shuttle=tt03p5\n")
