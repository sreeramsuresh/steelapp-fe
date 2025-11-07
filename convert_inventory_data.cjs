#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function convertInventoryData() {
    const inputFile = '/mnt/c/Users/sreer/Downloads/Stainless_Steel_Products.xlsx';
    const outputFile = '/mnt/c/Users/sreer/Downloads/Stainless_Steel_Products_converted.csv';
    
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
        
        // Template columns for inventory items
        const templateColumns = [
            'description', 'product_type', 'grade', 'finish', 'size', 'thickness',
            'quantity', 'min_stock', 'price_purchased', 'selling_price', 'landed_cost',
            'location', 'warehouse_name'
        ];
        
        // Auto-detect column mappings for inventory
        const columnMapping = {};
        
        originalColumns.forEach(col => {
            const colLower = col.toLowerCase().trim();
            
            // Map common variations for steel inventory
            if (['description', 'item_description', 'product_description', 'name', 'product_name'].some(x => colLower.includes(x))) {
                columnMapping['description'] = col;
            } else if (['type', 'product_type', 'category', 'item_type'].some(x => colLower.includes(x))) {
                columnMapping['product_type'] = col;
            } else if (['grade', 'steel_grade', 'material_grade', 'ss_grade'].some(x => colLower.includes(x))) {
                columnMapping['grade'] = col;
            } else if (['finish', 'surface_finish', 'finishing', 'surface'].some(x => colLower.includes(x))) {
                columnMapping['finish'] = col;
            } else if (['size', 'dimensions', 'dimension', 'sizes'].some(x => colLower.includes(x))) {
                columnMapping['size'] = col;
            } else if (['thickness', 'thick', 'gauge', 'thk'].some(x => colLower.includes(x))) {
                columnMapping['thickness'] = col;
            } else if (['quantity', 'qty', 'stock', 'available', 'in_stock'].some(x => colLower.includes(x))) {
                columnMapping['quantity'] = col;
            } else if (['min_stock', 'minimum_stock', 'min_qty', 'reorder_level'].some(x => colLower.includes(x))) {
                columnMapping['min_stock'] = col;
            } else if (['price', 'cost_price', 'purchase_price', 'buying_price'].some(x => colLower.includes(x))) {
                columnMapping['price_purchased'] = col;
            } else if (['selling_price', 'sale_price', 'retail_price', 'sell_price'].some(x => colLower.includes(x))) {
                columnMapping['selling_price'] = col;
            } else if (['landed_cost', 'total_cost', 'landed_price'].some(x => colLower.includes(x))) {
                columnMapping['landed_cost'] = col;
            } else if (['location', 'storage_location', 'bin_location', 'rack'].some(x => colLower.includes(x))) {
                columnMapping['location'] = col;
            } else if (['warehouse', 'warehouse_name', 'store', 'godown'].some(x => colLower.includes(x))) {
                columnMapping['warehouse_name'] = col;
            }
        });
        
        console.log('\nDetected column mappings:');
        Object.entries(columnMapping).forEach(([templateCol, sourceCol]) => {
            console.log(`  ${templateCol} <- ${sourceCol}`);
        });
        
        // Convert the data
        const convertedData = jsonData.map((row, index) => {
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
            
            // Set defaults and validate required fields
            if (!convertedRow['quantity'] || convertedRow['quantity'] === '') {
                convertedRow['quantity'] = 0;
            }
            if (!convertedRow['min_stock'] || convertedRow['min_stock'] === '') {
                convertedRow['min_stock'] = 0;
            }
            
            // Generate description if empty
            if (!convertedRow['description'] || convertedRow['description'] === '') {
                const parts = [];
                if (convertedRow['grade']) parts.push(convertedRow['grade']);
                if (convertedRow['product_type']) parts.push(convertedRow['product_type']);
                if (convertedRow['size']) parts.push(convertedRow['size']);
                if (convertedRow['thickness']) parts.push(`${convertedRow['thickness']}mm`);
                if (convertedRow['finish']) parts.push(convertedRow['finish']);
                
                convertedRow['description'] = parts.length > 0 ? parts.join(' ') : `Item ${index + 1}`;
            }
            
            return convertedRow;
        });
        
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
convertInventoryData();