# Run Credit Note tests with detailed error logging
# Save this file and run in PowerShell from D:\Ultimate Steel\steelapp-fe

$ErrorActionPreference = "Continue"
$OutputFile = "credit-note-test-errors-detailed.txt"

Write-Host "Running Credit Note smoke tests with detailed logging..."
Write-Host "Output will be saved to: $OutputFile"
Write-Host ""

# Run tests and capture all output
npm test -- src/pages/__tests__/CreditNoteList.smoke.test.jsx src/pages/__tests__/CreditNoteForm.smoke.test.jsx 2>&1 | Tee-Object -FilePath $OutputFile

Write-Host ""
Write-Host "Test run complete. Output saved to: $OutputFile"
Write-Host "Please share this file with Claude for debugging."
