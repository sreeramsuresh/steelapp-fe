/**
 * Case Conversion Utilities
 * Provides deep recursive conversion between camelCase and snake_case
 * Used by httpClient to ensure consistent API communication
 */

/**
 * Convert a string from camelCase to snake_case
 * @param str - camelCase string
 * @returns snake_case string
 */
export function toSnakeCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, ''); // Remove leading underscore if first char was uppercase
}

/**
 * Convert a string from snake_case to camelCase
 * @param str - snake_case string
 * @returns camelCase string
 */
export function toCamelCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Check if a value is a plain object (not array, null, Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    !(value instanceof File) &&
    !(value instanceof Blob)
  );
}

/**
 * Recursively convert all object keys from camelCase to snake_case
 * @param obj - Object with camelCase keys
 * @returns Object with snake_case keys
 */
export function toSnakeCaseDeep<T = unknown>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCaseDeep(item)) as T;
  }

  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key);
      result[snakeKey] = toSnakeCaseDeep(value);
    }
    
    return result as T;
  }

  // Primitive values (string, number, boolean, Date, etc.)
  return obj;
}

/**
 * Recursively convert all object keys from snake_case to camelCase
 * @param obj - Object with snake_case keys
 * @returns Object with camelCase keys
 */
export function toCamelCaseDeep<T = unknown>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCaseDeep(item)) as T;
  }

  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      result[camelKey] = toCamelCaseDeep(value);
    }
    
    return result as T;
  }

  // Primitive values
  return obj;
}

/**
 * Validate that an object contains only camelCase keys (dev-time check)
 * @param obj - Object to validate
 * @param entityName - Name for error messages
 * @returns Array of snake_case keys found (empty if valid)
 */
export function findSnakeCaseKeys(obj: unknown, entityName = 'object'): string[] {
  const snakeCaseKeys: string[] = [];
  
  if (!isPlainObject(obj)) {
    return snakeCaseKeys;
  }

  for (const key of Object.keys(obj)) {
    if (key.includes('_')) {
      snakeCaseKeys.push(key);
    }
    
    const value = (obj as Record<string, unknown>)[key];
    if (isPlainObject(value)) {
      const nested = findSnakeCaseKeys(value, `${entityName}.${key}`);
      snakeCaseKeys.push(...nested.map(k => `${key}.${k}`));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (isPlainObject(item)) {
          const nested = findSnakeCaseKeys(item, `${entityName}.${key}[${index}]`);
          snakeCaseKeys.push(...nested.map(k => `${key}[${index}].${k}`));
        }
      });
    }
  }

  return snakeCaseKeys;
}
