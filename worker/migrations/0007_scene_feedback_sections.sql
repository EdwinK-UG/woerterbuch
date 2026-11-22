-- The feedback form follows the way a scene is built (grammatik/buehne/meinung.js): free writing first, then one
-- section each for understanding the film, the pictures and animation, the practice, and problems. `good` stays
-- "what you liked"; `improve` is kept for the entries sent before the sections existed.
ALTER TABLE scene_feedback ADD COLUMN free TEXT NOT NULL DEFAULT '';
ALTER TABLE scene_feedback ADD COLUMN understand TEXT NOT NULL DEFAULT '';
ALTER TABLE scene_feedback ADD COLUMN pictures TEXT NOT NULL DEFAULT '';
ALTER TABLE scene_feedback ADD COLUMN practice TEXT NOT NULL DEFAULT '';
ALTER TABLE scene_feedback ADD COLUMN bugs TEXT NOT NULL DEFAULT '';
-- Each scene comes in up to four versions: short or long ("ausführlich", with an introduction), each explained in
-- German (de) or in English with German examples (en). `version` is the one the person was watching; the long
-- versions get their own stars; `preference` is the version that helps most (de, en, de-long, en-long or same).
ALTER TABLE scene_feedback ADD COLUMN version TEXT NOT NULL DEFAULT '';
ALTER TABLE scene_feedback ADD COLUMN rating_de_long INTEGER CHECK(rating_de_long BETWEEN 1 AND 5);
ALTER TABLE scene_feedback ADD COLUMN rating_en_long INTEGER CHECK(rating_en_long BETWEEN 1 AND 5);
ALTER TABLE scene_feedback ADD COLUMN preference TEXT NOT NULL DEFAULT '';
