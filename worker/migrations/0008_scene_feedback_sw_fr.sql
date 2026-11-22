-- Two more languages for the animated grammar scenes: explained in Kenyan Swahili (sw) and in standard French (fr),
-- each with German examples, short or long. Their stars get their own columns; `version`, `preference` and `lang`
-- now also take sw, fr, sw-long and fr-long.
ALTER TABLE scene_feedback ADD COLUMN rating_sw INTEGER CHECK(rating_sw BETWEEN 1 AND 5);
ALTER TABLE scene_feedback ADD COLUMN rating_fr INTEGER CHECK(rating_fr BETWEEN 1 AND 5);
ALTER TABLE scene_feedback ADD COLUMN rating_sw_long INTEGER CHECK(rating_sw_long BETWEEN 1 AND 5);
ALTER TABLE scene_feedback ADD COLUMN rating_fr_long INTEGER CHECK(rating_fr_long BETWEEN 1 AND 5);
