#!/usr/bin/env python3
"""
Customer Data Converter
Converts existing customer Excel file to match the upload template format
"""

import pandas as pd
import sys
import os

def convert_customer_data():
    # Input and output file paths
    input_file = '/mnt/c/Users/sreer/Downloads/Usteel/cbc.xlsx'
    output_file = '/mnt/c/Users/sreer/Downloads/Usteel/cbc_converted.csv'
    
    try:
        # Read the existing Excel file
        print(f"Reading file: {input_file}")
        
        # Try different sheet names and first few rows to understand structure
        xl_file = pd.ExcelFile(input_file)
        print(f"Available sheets: {xl_file.sheet_names}")
        
        # Read the first sheet
        df = pd.read_excel(input_file, sheet_name=0)
        
        print(f"Original file shape: {df.shape}")
        print(f"Original columns: {list(df.columns)}")
        print("\nFirst few rows:")
        print(df.head())
        
        # Template column mapping - adjust these based on your actual column names
        template_columns = [
            'name', 'company', 'email', 'phone', 'alternate_phone',
            'address_street', 'address_city', 'address_country',
            'vat_number', 'trn_number', 'trade_license_number', 'trade_license_expiry',
            'contact_person', 'website', 'payment_terms', 'credit_limit', 'current_credit', 'status'
        ]
        
        # Create new DataFrame with template structure
        converted_df = pd.DataFrame(columns=template_columns)
        
        # Map your existing columns to template columns
        # You'll need to adjust these mappings based on your actual column names
        column_mapping = {}
        
        # Try to auto-detect common column names
        df_columns_lower = [col.lower().strip() for col in df.columns]
        
        for i, col in enumerate(df.columns):
            col_lower = col.lower().strip()
            
            # Map common variations
            if any(x in col_lower for x in ['name', 'customer', 'client']):
                if 'company' not in col_lower:
                    column_mapping['name'] = col
            elif any(x in col_lower for x in ['company', 'business', 'firm']):
                column_mapping['company'] = col
            elif 'email' in col_lower or 'mail' in col_lower:
                column_mapping['email'] = col
            elif any(x in col_lower for x in ['phone', 'mobile', 'contact', 'tel']):
                if 'alternate' not in col_lower and 'second' not in col_lower:
                    column_mapping['phone'] = col
                else:
                    column_mapping['alternate_phone'] = col
            elif any(x in col_lower for x in ['address', 'location', 'street']):
                if any(x in col_lower for x in ['street', 'line1']):
                    column_mapping['address_street'] = col
                elif any(x in col_lower for x in ['city']):
                    column_mapping['address_city'] = col
                elif any(x in col_lower for x in ['country']):
                    column_mapping['address_country'] = col
                else:
                    column_mapping['address_street'] = col  # Default to street
            elif any(x in col_lower for x in ['vat', 'tax']):
                column_mapping['vat_number'] = col
            elif 'trn' in col_lower:
                column_mapping['trn_number'] = col
            elif any(x in col_lower for x in ['license', 'licence']):
                if any(x in col_lower for x in ['expiry', 'expire', 'date']):
                    column_mapping['trade_license_expiry'] = col
                else:
                    column_mapping['trade_license_number'] = col
            elif any(x in col_lower for x in ['contact_person', 'representative', 'rep']):
                column_mapping['contact_person'] = col
            elif 'website' in col_lower or 'url' in col_lower:
                column_mapping['website'] = col
            elif any(x in col_lower for x in ['payment', 'terms']):
                column_mapping['payment_terms'] = col
            elif any(x in col_lower for x in ['credit', 'limit']):
                column_mapping['credit_limit'] = col
            elif 'status' in col_lower:
                column_mapping['status'] = col
        
        print(f"\nDetected column mappings:")
        for template_col, source_col in column_mapping.items():
            print(f"  {template_col} <- {source_col}")
        
        # Apply the mapping
        for template_col, source_col in column_mapping.items():
            if source_col in df.columns:
                converted_df[template_col] = df[source_col]
        
        # Fill in defaults for missing columns
        if 'address_country' not in column_mapping:
            converted_df['address_country'] = 'UAE'  # Default country
        
        if 'status' not in column_mapping:
            converted_df['status'] = 'active'  # Default status
        
        if 'credit_limit' not in column_mapping:
            converted_df['credit_limit'] = 0  # Default credit limit
            
        if 'current_credit' not in column_mapping:
            converted_df['current_credit'] = 0  # Default current credit
        
        # Clean up the data
        # Remove completely empty rows
        converted_df = converted_df.dropna(how='all')
        
        # Clean up name column (required field)
        if 'name' in converted_df.columns:
            converted_df = converted_df.dropna(subset=['name'])
            converted_df = converted_df[converted_df['name'].str.strip() != '']
        
        print(f"\nConverted file shape: {converted_df.shape}")
        print(f"Sample converted data:")
        print(converted_df.head())
        
        # Save to CSV
        converted_df.to_csv(output_file, index=False)
        print(f"\nConverted file saved to: {output_file}")
        
        # Also show unmapped columns
        unmapped_columns = set(df.columns) - set(column_mapping.values())
        if unmapped_columns:
            print(f"\nUnmapped columns from original file:")
            for col in unmapped_columns:
                print(f"  - {col}")
                print(f"    Sample values: {df[col].dropna().head(3).tolist()}")
        
        return True
        
    except Exception as e:
        print(f"Error converting file: {str(e)}")
        return False

if __name__ == "__main__":
    convert_customer_data()