"""A plain stand-in for the park scenery (sky, ground, posts) so the playback can be tested before the real scenery arrives.
emit_scenery(el, ab, prop, bindp, root, GY) -> the 'Liv slot' node and the layers (view-model number + multiplier per world layer).
(The first child is drawn on top, so the slot comes first and the sky last.)"""

def emit_scenery(el, ab, prop, bindp, root, GY):
    slot = el('Node', ab, name='Liv slot')
    ground = el('Shape', ab, name='ground', x=880, y=(GY + 864) / 2); el('Rectangle', ground, width=1760, height=864 - GY)
    f = el('Fill', ground); el('SolidColor', f, colorValue='FFB9D49A')
    far = el('Node', ab, name='layer far'); prop('parX0', 0.0); bindp(far, 13, 'parX0')
    for i in range(-8, 12):
        h = el('Shape', far, name=f'post {i}', x=880 + i * 300, y=GY - 160); el('Rectangle', h, width=40, height=320)
        f = el('Fill', h); el('SolidColor', f, colorValue='FFB98450')
    sky = el('Shape', ab, name='sky', x=880, y=GY / 2); el('Rectangle', sky, width=1760, height=GY)
    f = el('Fill', sky); el('SolidColor', f, colorValue='FFCFE6EE')
    return slot, [{'prop': 'parX0', 'm': 1.0}]
