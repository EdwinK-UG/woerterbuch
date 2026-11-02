"""Local paths shared by vocabulary scripts. Raw corpora stay outside Git."""
import os
import tempfile
from pathlib import Path

REPOSITORY = Path(__file__).resolve().parents[2]
SCRIPTS = Path(__file__).resolve().parent
DATA_ROOT = Path(os.environ.get("VOCAB_DATA_DIR", REPOSITORY / ".local" / "vocabulary-data")).resolve()
RAW_DATA = DATA_ROOT / "raw"
WIKTIONARY = DATA_ROOT / "wikt"
SITE_CHAPTERS = Path(os.environ.get("VOCAB_OUTPUT_DIR", REPOSITORY / ".local" / "lessons")).resolve()


def write_chapter(number, text):
    """Replace a generated chapter only after a complete write."""
    SITE_CHAPTERS.mkdir(parents=True, exist_ok=True)
    destination = SITE_CHAPTERS / f"k{number}.js"
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=SITE_CHAPTERS, delete=False) as output:
            temporary = Path(output.name)
            output.write(text)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
