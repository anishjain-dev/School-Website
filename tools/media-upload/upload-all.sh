#!/usr/bin/env bash
# Run once after setting CF_ACCOUNT_ID and CF_IMAGES_TOKEN in .env
# Usage: bash tools/media-upload/upload-all.sh
# After each upload, copy the printed image ID into the relevant content file.

set -e
source .env 2>/dev/null || true

BASE="C:/Users/Admin/Downloads/Websites-extracted/Websites"

echo "=== CLOUDFLARE IMAGES ==="

echo "--- FALH Logo ---"
node tools/media-upload/cli.mjs upload "$BASE/FALH/FALH Logo - Colour - JPEG.jpg" \
  --alt "FALH - Fountainhead Avadh Learning Hub logo" --no-child

echo "--- FALH Instagram Profile Picture ---"
node tools/media-upload/cli.mjs upload "$BASE/FALH/FALH - instagram Profile picture.png" \
  --alt "FALH Instagram profile picture" --no-child

echo "--- FSK Front Facade ---"
node tools/media-upload/cli.mjs upload "$BASE/FSK/Images FSK/FSK Front Facade Image.jpg" \
  --alt "Fountainhead School Kunkni, Surat - front facade" --no-child

echo "--- FSK Sports Ground ---"
node tools/media-upload/cli.mjs upload "$BASE/FSK/Images FSK/FSK Ground.jpg" \
  --alt "Fountainhead School Kunkni sports ground" --no-child

echo "--- FPA Front Facade ---"
node tools/media-upload/cli.mjs upload "$BASE/FPA/FPA Front Facade.jpeg" \
  --alt "Fountainhead Preschool Adajan front facade" --no-child

echo "--- FPV and FSM Front Facade ---"
node tools/media-upload/cli.mjs upload "$BASE/FPV/FPV and FSM Front Facade.JPG" \
  --alt "Fountainhead Preschool Vesu and Fountainhead School Malgama front facade" --no-child

echo ""
echo "=== R2 UPLOADS (use wrangler r2 object put) ==="
echo "These need: npx wrangler r2 object put <bucket>/<key> --file <path>"
echo ""
echo "FS Learning Model PDF:"
echo "  npx wrangler r2 object put fw-media/group/learning-model.pdf --file '$BASE/FS/FS Learning Model.pdf'"
echo ""
echo "FALH Flyer Aug 2026:"
echo "  npx wrangler r2 object put fw-media/falh/flyer-aug-2026.pdf --file '$BASE/FALH/FALH Flyer - August 2026.pdf'"
echo ""
echo "FALH Reel:"
echo "  npx wrangler r2 object put fw-media/falh/reel.mp4 --file '$BASE/FALH/FALH Reel.mp4'"
echo ""
echo "FSK June Newsletter:"
echo "  npx wrangler r2 object put fw-media/fsk/newsletters/june-newsletter.pdf --file '$BASE/FSK/Newsletters/June Newsletter.pdf'"
echo ""
echo "FSK July Newsletter:"
echo "  npx wrangler r2 object put fw-media/fsk/newsletters/july-newsletter.pdf --file '$BASE/FSK/Newsletters/July Newsletter.pdf'"
echo ""
echo "FS Got Talent Reel:"
echo "  npx wrangler r2 object put fw-media/fsk/reels/fs-got-talent.mp4 --file '$BASE/FSK/Reels FSK/FS Got Talent .mp4'"
echo ""
echo "FWGS PYP Brochure:"
echo "  npx wrangler r2 object put fw-media/fwgs/brochures/pyp-brochure.pdf --file '$BASE/FWGS/FWGS - PYP Programme Brochures - Rashida Muchhala.pdf'"
echo ""
echo "FWGS MYP Brochure:"
echo "  npx wrangler r2 object put fw-media/fwgs/brochures/myp-brochure.pdf --file '$BASE/FWGS/FWGS - MYP Programme Brochures - Rashida Muchhala.pdf'"
echo ""
echo "FWGS DP Brochure:"
echo "  npx wrangler r2 object put fw-media/fwgs/brochures/dp-brochure.pdf --file '$BASE/FWGS/FWGS - DP Programme Brochures - Rashida Muchhala.pdf'"
echo ""
echo "FSK Policy PDFs (supplementary - policies already in markdown):"
for pdf in "$BASE/FSK/Policies/"*.pdf; do
  name=$(basename "$pdf" .pdf | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
  echo "  npx wrangler r2 object put fw-media/fsk/policies/$name.pdf --file '$pdf'"
done
echo ""
echo "Done. Copy each uploaded ID into the relevant content file."
