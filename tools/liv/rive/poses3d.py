"""The test poses in body space (metres, relative to the standing pelvis: X to her left, Y up, Z forward), as Luau text.

Converted from the three-quarter screen poses of liv-tq (a hand at screen (x, y) in the 43 degree view is X cos43 + Z sin43 from
the pelvis); the Z of a hand is chosen so the arm hangs or reaches the way it does in that picture.
"""
POSES3D = """ {hRX=-.10,hRY=.106,hRZ=-.02,hLX=.10,hLY=.122,hLZ=.12},                                                  -- 0 Rest: arms hang
 {hRX=-.43,hRY=.596,hRZ=.14,hLX=.10,hLY=.122,hLZ=.12,shapeR=2,lean=-.03},                                   -- 1 Wave
 {hRX=-.513,hRY=.313,hRZ=.05,hLX=.384,hLY=.263,hLZ=0,shapeR=4,lean=.04,headR=.04},                           -- 2 Reach
 {hRX=-.291,hRY=.6225,hRZ=.06,hLX=.302,hLY=.6225,hLZ=.06,shapeR=2,shapeL=2,pelDY=.016,headR=-.03},               -- 3 Cheer
 {hRX=-.154,hRY=-.018,hRZ=0,hLX=.14,hLY=-.018,hLZ=0,pelDY=-.092,ff=1,lean=.1,headR=-.07},                    -- 4 Crouch
 {hRX=-.178,hRY=.1225,hRZ=0,hLX=.178,hLY=.112,hLZ=0,dRu=.0766,dRup=.0905,ff=1,lean=.05},                     -- 5 Step
 {hRX=-.247,hRY=.4438,hRZ=0,hLX=.2636,hLY=.4438,hLZ=0,shapeR=3,shapeL=5,ff=1,lean=-.04},                     -- 6 Hands
 {bind=1}                                                                                                     -- 7 Bind: the art as drawn"""
