# Complete bird illustrations update

This package replaces missing, ambiguous and misleading illustrations with 633 reviewed bird-style raster assets. It preserves the original teaching wording, translations, speech inputs, JavaScript, CSS, practice questions, scoring and progress logic.

## GitHub deployment

Use the GitHub Pages ZIP when your deployed site has index.html at its publishing root. Extract it and copy its contents into that root, replacing the existing data and images directories with the included versions. Commit and push through your normal GitHub workflow. Do not upload the ZIP itself as the website. Keep the existing Pages publishing branch/folder configuration. If your site publishes from docs/, copy these files into docs/; if it publishes from repository root, copy them there.

The changes are in data/*.json and images/complete/*.webp. Uploading only pictures is insufficient because the JSON now points to their new paths. The app's HTML, JavaScript and CSS are unchanged. Keep the same deployed URL to retain browser-local progress. Refresh the page after deployment; a hard refresh may be needed for cached JSON/images.

Use the complete trainer ZIP for the original Windows launchers and full package structure. The runnable app remains in trainer_source/.

## Artwork and validation

Every generated asset was visually reviewed for the intended subject, bird style, number, ownership, polarity and spatial relationship. Rejected generations were replaced. All 96 spatial examples have literal illustrations, including lesson 53 behind/in front of. Vocabulary scenes use their dialogue context. Existing appropriate bird scenes remain where thematic support is sufficient; short answers and text/audio-only interfaces do not receive arbitrary artwork.

See complete-image-audit.csv for the entry-by-entry evaluation, complete-image-prompts.json for final prompts and source records, and the validation reports for checks performed. Browser checks cover all 95 lessons, 760 guided questions, 23 stories and four viewports. Tablet viewport testing does not constitute physical iPad Safari testing. Image generation used the built-in image tool; billing totals are not available from the task.
