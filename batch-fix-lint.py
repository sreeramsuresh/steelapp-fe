#!/usr/bin/env python3
"""
Batch Linting Fixer for Ultimate Steel ERP Frontend
Automatically fixes common linting patterns across the codebase.
"""

import re
import os
import sys
from pathlib import Path
from typing import List, Tuple

class LintBatchFixer:
    def __init__(self, src_dir: str = "src"):
        self.src_dir = Path(src_dir)
        self.fixes_applied = {
            "button_type": 0,
            "semantic_button": 0,
            "keyboard_handlers": 0,
            "use_callback": 0
        }

    def fix_button_type_attributes(self, content: str) -> str:
        """Add type='button' to buttons without type attribute"""
        # Pattern: <button without type attribute
        pattern = r'<button\s+(?!type=)'

        def replace_button(match):
            self.fixes_applied["button_type"] += 1
            return '<button type="button" '

        # Only replace if the button doesn't already have type
        fixed = content
        matches = re.finditer(r'<button\s+([^>]*?)>', content)

        for match in matches:
            button_tag = match.group(0)
            attrs = match.group(1)

            # Check if type attribute already exists
            if not re.search(r'\btype\s*=', attrs):
                # Add type="button" as first attribute
                new_tag = '<button type="button" ' + attrs + '>'
                fixed = fixed.replace(button_tag, new_tag, 1)
                self.fixes_applied["button_type"] += 1

        return fixed

    def fix_semantic_buttons(self, content: str) -> str:
        """Convert div role='button' to semantic button elements"""
        # Pattern 1: Multi-line div with role="button"
        pattern1 = r'<div\s+([^>]*?)role="button"([^>]*?)>'
        pattern2 = r'<div\s+([^>]*?)role=\'button\'([^>]*?)>'

        def replace_div_to_button(match):
            before_role = match.group(1)
            after_role = match.group(2)

            # Combine attributes and add type="button"
            all_attrs = (before_role + after_role).strip()

            # Remove role="button" or role='button'
            all_attrs = re.sub(r'\s*role\s*=\s*["\']button["\']\s*', ' ', all_attrs)

            # Remove tabIndex if present (buttons are naturally focusable)
            all_attrs = re.sub(r'\s*tabIndex\s*=\s*\{?\d+\}?\s*', ' ', all_attrs)

            # Add type="button" if not present
            if 'type=' not in all_attrs:
                all_attrs = 'type="button" ' + all_attrs

            # Add CSS classes to preserve styling if div had background/border
            if 'className=' in all_attrs and 'bg-' not in all_attrs:
                # Find className and add transparent background
                all_attrs = re.sub(
                    r'className=(["\'])([^"\']*?)(["\'])',
                    r'className=\1\2 border-0 bg-transparent\3',
                    all_attrs
                )

            self.fixes_applied["semantic_button"] += 1
            return f'<button {all_attrs.strip()}>'

        fixed = re.sub(pattern1, replace_div_to_button, content)
        fixed = re.sub(pattern2, replace_div_to_button, fixed)

        return fixed

    def fix_keyboard_handlers(self, content: str) -> str:
        """Add onKeyDown handlers to elements with onClick"""
        # This is more complex and may need manual review
        # For now, skip to avoid breaking code
        return content

    def process_file(self, file_path: Path) -> bool:
        """Process a single file and apply all fixes"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()

            content = original_content

            # Apply fixes in order
            content = self.fix_button_type_attributes(content)
            content = self.fix_semantic_buttons(content)

            # Only write if changes were made
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True

            return False

        except Exception as e:
            print(f"Error processing {file_path}: {e}", file=sys.stderr)
            return False

    def process_directory(self) -> int:
        """Process all JSX/TSX files in src directory"""
        files_processed = 0

        # Find all .jsx and .tsx files
        for ext in ['*.jsx', '*.tsx', '*.js', '*.ts']:
            for file_path in self.src_dir.rglob(ext):
                # Skip test files for now
                if '.test.' in str(file_path) or '__tests__' in str(file_path):
                    continue

                if self.process_file(file_path):
                    files_processed += 1
                    print(f"Fixed: {file_path}")

        return files_processed

    def print_summary(self):
        """Print summary of fixes applied"""
        print("\n" + "="*60)
        print("BATCH FIXING SUMMARY")
        print("="*60)
        print(f"Button type attributes added: {self.fixes_applied['button_type']}")
        print(f"Semantic buttons converted: {self.fixes_applied['semantic_button']}")
        print(f"Keyboard handlers added: {self.fixes_applied['keyboard_handlers']}")
        print(f"useCallback wrappers added: {self.fixes_applied['use_callback']}")
        print("="*60 + "\n")

def main():
    fixer = LintBatchFixer("src")

    print("Starting batch linting fixes...")
    files_processed = fixer.process_directory()

    print(f"\nProcessed {files_processed} files")
    fixer.print_summary()

if __name__ == "__main__":
    main()
