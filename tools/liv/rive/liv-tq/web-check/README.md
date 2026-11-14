Loads `Liv-TQ.riv` in the Rive web runtime (unpkg `@rive-app/canvas`) and exposes `setN(name, value)` / `getN(name)` for the
view-model numbers (`gait` 0 stand / 1 walk / 2 run, `pose` 0-7, `rate` time scale).

    cd tools/liv/rive/liv-tq
    rive . --publish --output-dir=web-check        # writes a signed, watermarked Liv-TQ.riv (2 MB); needs `rive login`
    cd web-check && python3 -m http.server 8767 --bind 127.0.0.1
    # open http://127.0.0.1:8767/index.html and click Walk / Run

Checked 2026-11-13 in the Rive browser pane (desktop Chromium): the file loads, the Luau controller runs, a click on Walk
sets `gait` to 1 and the speed reaches 0.9 m/s, `gait` 2 reaches 2.5 m/s, 60 frames a second. Not tried on a phone or in Safari.
