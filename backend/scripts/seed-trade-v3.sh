#!/bin/bash
# Safe script to add Trade Compliance v3.0 template without deleting data

echo "🔒 SAFE MODE: This will ONLY add the Trade Compliance v3.0 template"
echo "   Your existing data will NOT be deleted"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npx tsx prisma/seed-trade-v3-only.ts
fi
