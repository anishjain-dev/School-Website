#!/usr/bin/env bash
# Run this script from YOUR OWN terminal (not Claude Code).
# It creates a GitHub release, uploads all media files, then updates content.
#
# Usage (from School-Website root):
#   bash tools/media-upload/github-media-release.sh
#
# Requirements:
#   - gh CLI authenticated: gh auth login

set -e

REPO="anishjain-dev/School-Website"
TAG="v0-media-assets"
TEMP="C:/Users/Admin/AppData/Local/Temp"
WORD_MEDIA="C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Downloads/caf49608-2b6a-4d68-b58c-8c32a17c00ee/scratchpad/word-media/word/media"

echo "=== Checking gh auth ==="
gh auth status || { echo "Run: gh auth login"; exit 1; }

echo ""
echo "=== Creating GitHub release: $TAG ==="
gh release create "$TAG" \
  --repo "$REPO" \
  --title "Media Assets v0" \
  --notes "Static media assets for Fountainhead Schools website. Not in git — release assets can be independently deleted for consent withdrawal (WA-36)." \
  --prerelease 2>/dev/null || echo "Release already exists — continuing to upload..."

echo ""
echo "=== Uploading campus images ==="

gh release upload "$TAG" \
  "$TEMP/FALH Logo - Colour - JPEG.jpg#FALH-Logo.jpg" \
  "$TEMP/FALH - instagram Profile picture.png#FALH-Instagram-Profile.png" \
  "$TEMP/FSK Front Facade Image.jpg#FSK-Front-Facade.jpg" \
  "$TEMP/FSK Ground.jpg#FSK-Ground.jpg" \
  "$TEMP/FPV and FSM Front Facade.JPG#FPV-FSM-Front-Facade.jpg" \
  "$TEMP/FPA Front Facade.jpeg#FPA-Front-Facade.jpg" \
  --repo "$REPO" --clobber

echo ""
echo "=== Uploading award images (from Word doc) ==="

if [ -d "$WORD_MEDIA" ]; then
  gh release upload "$TAG" \
    "$WORD_MEDIA/image1.png#award-national-innovation-2020.png" \
    "$WORD_MEDIA/image2.png#fs-mission-statement.png" \
    "$WORD_MEDIA/image3.png#award-ida-2025.png" \
    "$WORD_MEDIA/image4.png#anti-bullying-types-diagram.png" \
    "$WORD_MEDIA/image5.png#award-skill-development-2023.png" \
    "$WORD_MEDIA/image6.png#award-ib-forum-didac.png" \
    "$WORD_MEDIA/image7.png#award-cfore-2025.png" \
    "$WORD_MEDIA/image8.png#award-fit-india-2020.png" \
    "$WORD_MEDIA/image9.png#award-cfore-2026.png" \
    "$WORD_MEDIA/image10.png#award-education-world-2019.png" \
    --repo "$REPO" --clobber
else
  echo "WARN: Word media folder not found at $WORD_MEDIA"
fi

echo ""
echo "=== Uploading PDFs ==="

gh release upload "$TAG" \
  "$TEMP/FS Learning Model.pdf#FS-Learning-Model.pdf" \
  "$TEMP/FALH Flyer - August 2026.pdf#FALH-Flyer-August-2026.pdf" \
  "$TEMP/June Newsletter.pdf#FSK-Newsletter-June.pdf" \
  "$TEMP/July Newsletter.pdf#FSK-Newsletter-July.pdf" \
  "$TEMP/FSK Admission policy.pdf#FSK-Admission-Policy.pdf" \
  "$TEMP/FSK Assessment Policy.pdf#FSK-Assessment-Policy.pdf" \
  "$TEMP/FSK Canteen_Pantry Usage Guidelines.pdf#FSK-Canteen-Pantry-Guidelines.pdf" \
  "$TEMP/FSK Child Protection Policy.pdf#FSK-Child-Protection-Policy.pdf" \
  "$TEMP/FSK Discipline Policy.pdf#FSK-Discipline-Policy.pdf" \
  "$TEMP/FSK Food policy (Parents & Students).pdf#FSK-Food-Policy.pdf" \
  "$TEMP/FSK Health Exclusion Policy.pdf#FSK-Health-Exclusion-Policy.pdf" \
  "$TEMP/FSK Language Policy.pdf#FSK-Language-Policy.pdf" \
  "$TEMP/FSK Learning Diversity & Inclusion Policy .pdf#FSK-Learning-Diversity-Inclusion-Policy.pdf" \
  --repo "$REPO" --clobber

echo ""
echo "=== Upload complete! ==="
echo ""

RELEASE_URL="https://github.com/$REPO/releases/download/$TAG"

echo "Now update content files with these URLs:"
echo ""
echo "FSK heroImage:    $RELEASE_URL/FSK-Front-Facade.jpg"
echo "FSM heroImage:    $RELEASE_URL/FPV-FSM-Front-Facade.jpg"
echo "Cfore 2026:       $RELEASE_URL/award-cfore-2026.png"
echo "Cfore 2025:       $RELEASE_URL/award-cfore-2025.png"
echo "IDA 2025:         $RELEASE_URL/award-ida-2025.png"
echo "Skill Dev 2023:   $RELEASE_URL/award-skill-development-2023.png"
echo "Natl Award 2020:  $RELEASE_URL/award-national-innovation-2020.png"
echo "FIT India 2020:   $RELEASE_URL/award-fit-india-2020.png"
echo "EW Award 2019:    $RELEASE_URL/award-education-world-2019.png"
echo "IB DIDAC:         $RELEASE_URL/award-ib-forum-didac.png"
echo "Anti-Bully Diag:  $RELEASE_URL/anti-bullying-types-diagram.png"
echo "Mission Image:    $RELEASE_URL/fs-mission-statement.png"
echo ""
echo "Done. Tell Claude Code 'script done' and it will update all content files automatically."
