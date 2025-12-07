#!/bin/bash

echo "Checking ESLint warnings for fixed files..."
echo ""

files=(
  "src/utils/purchaseOrderNormalizer.ts"
  "src/utils/paymentNormalizer.ts"
  "src/utils/productNormalizer.ts"
  "src/utils/customerNormalizer.ts"
  "src/constants/defaultTemplateSettings.js"
  "src/utils/supplierNormalizer.ts"
  "src/utils/deliveryNoteNormalizer.ts"
)

for file in "${files[@]}"; do
  echo "Checking $file..."
  npx eslint "$file" 2>&1 | grep -E "problems|warning|error" | head -3
  echo ""
done

echo "Summary:"
npx eslint "${files[@]}" 2>&1 | grep -E "problems"
