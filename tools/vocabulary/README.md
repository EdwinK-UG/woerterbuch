# Vocabulary source tools

Run the scripts from the directory containing your authored topic inputs. The files `<level>_<number>_words.txt`, `_picks.txt`, `_curated.json`, `.entries.json` and `k<number>.tpl.js` stay together.

Set `VOCAB_DATA_DIR` to a local directory containing `raw/` and `wikt/`. The default is `.local/vocabulary-data` under the repository. The expected raw files are `deu_sentences.tsv`, `eng_sentences.tsv` and `deu-eng_links.tsv`. Record the original source URLs, download dates, versions and attribution with those local files.

`VOCAB_OUTPUT_DIR` chooses the destination chapter directory. Its default is this repository's `grammatik/`. The scripts use Python's standard library.

From the authored-input directory, substitute the full path to the checked-out script directory in these commands.

```sh
python3 /path/to/checkout/tools/vocabulary/auto.py a1_201
# Inspect the review sheet and curate picks, translations and forms.
python3 /path/to/checkout/tools/vocabulary/setpicks.py a1_201 reviewed-changes.json
python3 /path/to/checkout/tools/vocabulary/build_topic.py a1_201
```

`auto.py` fetches missing Wiktionary records and preserves existing picks. `build_topic.py` assembles reviewed inputs and replaces a chapter after a complete write. It fails on a missing or duplicate template marker.

After generating a chapter, run `npm run assets` and `npm test` in the site repository. Review the actual lesson in an isolated preview. The automatic checks verify structure and reproducibility. A fluent speaker must still check German, translations, answer ambiguity and level suitability.

Keep raw corpora and private editorial inputs in private storage. The local authoring backup supplied with this review contains the existing selected inputs and original scripts. Restore it separately and point these portable scripts at its topic directory. Obtain and record redistribution rights for every public source before publishing new material. Preserve the source-specific Wiktionary and Tatoeba credits when generating lessons.
