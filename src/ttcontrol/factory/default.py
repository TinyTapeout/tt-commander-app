from ttboard.demoboard import DemoBoard
import ttboard.util.shuttle_tests as st

tt = DemoBoard.get()
try:
    err = st.factory_test_clocking_04(tt)
except AttributeError:
    err = 'Unsupported Test Method'
    
okay = True

if err is not None:
    print(f"error=factory_test_clocking, {err}")
    okay = False
    
    
# TODO: bidir test through factory test project

if okay:
    print("factory_test=OK")
