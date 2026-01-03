# Cypress Test Fixtures

## PDF Upload Tests

For PDF upload tests to work properly, add a sample PDF file:

1. Create or obtain a sample supplier quotation PDF
2. Save it as `sample-quotation.pdf` in this folder
3. The PDF should contain typical quotation data:
   - Supplier name and reference
   - Quote date and validity
   - Line items with descriptions, quantities, and prices
   - Total amount

### Creating a Test PDF

You can create a simple test PDF using:

```bash
# Using LibreOffice (if installed)
echo "Supplier Quotation
Reference: SQ-TEST-001
Date: 2024-01-01
Supplier: Test Steel Mills

Item | Qty | Unit | Price | Amount
SS 304 Sheet 2mm | 100 | KG | 50.00 | 5000.00

Total: AED 5,000.00" > /tmp/test-quotation.txt

libreoffice --headless --convert-to pdf /tmp/test-quotation.txt
```

Or download a sample quotation PDF from the internet for testing.
