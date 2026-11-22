-- Feedback on the animated grammar scenes (grammatik/buehne/): star ratings for the German and the bilingual
-- (English) version, which one the person prefers, what worked and what did not, and the kind of device (phone, iOS,
-- Safari …) for tracing bugs. No names, accounts or IP addresses:
-- `actor` is a one-day hash used only to limit how much one visitor can send in a day.
CREATE TABLE IF NOT EXISTS scene_feedback(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created TEXT NOT NULL,
  day TEXT NOT NULL,
  actor TEXT NOT NULL,
  scene TEXT NOT NULL,
  rating_de INTEGER CHECK(rating_de BETWEEN 1 AND 5),
  rating_en INTEGER CHECK(rating_en BETWEEN 1 AND 5),
  prefer TEXT CHECK(prefer IN ('de','en','same')),
  good TEXT NOT NULL DEFAULT '',
  improve TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  watched TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'de'
);
CREATE INDEX IF NOT EXISTS scene_feedback_actor ON scene_feedback(day, actor);
CREATE INDEX IF NOT EXISTS scene_feedback_scene ON scene_feedback(scene, created);
