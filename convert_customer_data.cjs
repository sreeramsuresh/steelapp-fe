#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function convertCustomerData() {
    const inputFile = '/mnt/c/Users/sreer/Downloads/Usteel/cbc.xlsx';
    const outputFile = '/mnt/c/Users/sreer/Downloads/Usteel/cbc_converted.csv';
    
    try {
        console.log(`Reading file: ${inputFile}`);
        
        // Check if file exists
        if (!fs.existsSync(inputFile)) {
            console.error(`File not found: ${inputFile}`);
            return false;
        }
        
        // Read the Excel file
        const workbook = XLSX.readFile(inputFile);
        const sheetNames = workbook.SheetNames;
        console.log(`Available sheets: ${sheetNames.join(', ')}`);
        
        // Read the first sheet
        const worksheet = workbook.Sheets[sheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`Original file has ${jsonData.length} rows`);
        
        if (jsonData.length === 0) {
            console.error('No data found in the Excel file');
            return false;
        }
        
        // Show original columns
        const originalColumns = Object.keys(jsonData[0] || {});
        console.log(`Original columns: ${originalColumns.join(', ')}`);
        
        // Show first few rows
        console.log('\nFirst few rows:');
        console.log(JSON.stringify(jsonData.slice(0, 3), null, 2));
        
        // Template columns
        const templateColumns = [
            'name', 'company', 'email', 'phone', 'alternate_phone',
            'address_street', 'address_city', 'address_country',
            'vat_number', 'trn_number', 'trade_license_number', 'trade_license_expiry',
            'contact_person', 'website', 'payment_terms', 'credit_limit', 'current_credit', 'status'
        ];
        
        // Auto-detect column mappings
        const columnMapping = {};
        
        originalColumns.forEach(col => {
            const colLower = col.toLowerCase().trim();
            
            // Map common variations
            if (['name', 'customer_name', 'client_name', 'customer', 'client'].some(x => colLower.includes(x)) && !colLower.includes('company')) {
                columnMapping['name'] = col;
            } else if (['company', 'company_name', 'business', 'firm', 'organization'].some(x => colLower.includes(x))) {
                columnMapping['company'] = col;
            } else if (['email', 'e-mail', 'mail', 'email_address'].some(x => colLower.includes(x))) {
                columnMapping['email'] = col;
            } else if (['phone', 'mobile', 'telephone', 'tel', 'contact'].some(x => colLower.includes(x))) {
                if (!colLower.includes('alternate') && !colLower.includes('second') && !colLower.includes('alt')) {
                    columnMapping['phone'] = col;
                } else {
                    columnMapping['alternate_phone'] = col;
                }
            } else if (colLower.includes('address')) {
                if (colLower.includes('street') || colLower.includes('line1')) {
                    columnMapping['address_street'] = col;
                } else if (colLower.includes('city')) {
                    columnMapping['address_city'] = col;
                } else if (colLower.includes('country')) {
                    columnMapping['address_country'] = col;
                } else {
                    columnMapping['address_street'] = col; // Default to street
                }
            } else if (['vat', 'vat_number', 'tax_number'].some(x => colLower.includes(x))) {
                columnMapping['vat_number'] = col;
            } else if (['trn', 'trn_number', 'tax_registration'].some(x => colLower.includes(x))) {
                columnMapping['trn_number'] = col;
            } else if (colLower.includes('license') || colLower.includes('licence')) {
                if (colLower.includes('expiry') || colLower.includes('expire') || colLower.includes('date')) {
                    columnMapping['trade_license_expiry'] = col;
                } else {
                    columnMapping['trade_license_number'] = col;
                }
            } else if (['contact_person', 'representative', 'rep', 'contact_name'].some(x => colLower.includes(x))) {
                columnMapping['contact_person'] = col;
            } else if (['website', 'url', 'web_site'].some(x => colLower.includes(x))) {
                columnMapping['website'] = col;
            } else if (colLower.includes('payment') && colLower.includes('terms')) {
                columnMapping['payment_terms'] = col;
            } else if (colLower.includes('credit') && colLower.includes('limit')) {
                columnMapping['credit_limit'] = col;
            } else if (colLower.includes('status')) {
                columnMapping['status'] = col;
            }
        });
        
        console.log('\nDetected column mappings:');
        Object.entries(columnMapping).forEach(([templateCol, sourceCol]) => {
            console.log(`  ${templateCol} <- ${sourceCol}`);
        });
        
        // Convert the data
        const convertedData = jsonData.map(row => {
            const convertedRow = {};
            
            // Apply mappings
            templateColumns.forEach(templateCol => {
                const sourceCol = columnMapping[templateCol];
                if (sourceCol && row[sourceCol] !== undefined && row[sourceCol] !== null) {
                    convertedRow[templateCol] = row[sourceCol];
                } else {
                    convertedRow[templateCol] = '';
                }
            });
            
            // Set defaults
            if (!convertedRow['address_country'] || convertedRow['address_country'] === '') {
                convertedRow['address_country'] = 'UAE';
            }
            if (!convertedRow['status'] || convertedRow['status'] === '') {
                convertedRow['status'] = 'active';
            }
            if (!convertedRow['credit_limit'] || convertedRow['credit_limit'] === '') {
                convertedRow['credit_limit'] = 0;
            }
            if (!convertedRow['current_credit'] || convertedRow['current_credit'] === '') {
                convertedRow['current_credit'] = 0;
            }
            
            return convertedRow;
        }).filter(row => row.name && row.name.toString().trim() !== ''); // Remove rows without names
        
        console.log(`\nConverted ${convertedData.length} rows`);
        console.log('Sample converted data:');
        console.log(JSON.stringify(convertedData.slice(0, 2), null, 2));
        
        // Create CSV content
        const csvHeaders = templateColumns.join(',');
        const csvRows = convertedData.map(row => 
            templateColumns.map(col => {
                const value = row[col] || '';
                // Escape commas and quotes in CSV
                if (value.toString().includes(',') || value.toString().includes('"')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );
        
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
        // Write to file
        fs.writeFileSync(outputFile, csvContent);
        console.log(`\nConverted file saved to: ${outputFile}`);
        
        // Show unmapped columns
        const mappedSourceColumns = Object.values(columnMapping);
        const unmappedColumns = originalColumns.filter(col => !mappedSourceColumns.includes(col));
        
        if (unmappedColumns.length > 0) {
            console.log('\nUnmapped columns from original file:');
            unmappedColumns.forEach(col => {
                const sampleValues = jsonData.slice(0, 3).map(row => row[col]).filter(val => val !== undefined && val !== null);
                console.log(`  - ${col}: ${sampleValues.join(', ')}`);
            });
        }
        
        return true;
        
    } catch (error) {
        console.error(`Error converting file: ${error.message}`);
        return false;
    }
}

// Run the conversion
convertCustomerData();