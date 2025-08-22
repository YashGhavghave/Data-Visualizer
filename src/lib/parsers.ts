export type ParsedData = Record<string, string | number>[];

export function parseJson(content: string): ParsedData {
    try {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
            // Attempt to handle object of arrays
            const keys = Object.keys(data);
            if (keys.length > 0 && Array.isArray(data[keys[0]])) {
                const numRows = data[keys[0]].length;
                const result: ParsedData = [];
                for(let i = 0; i < numRows; i++) {
                    const row: Record<string, string | number> = {};
                    for(const key of keys) {
                         if (Array.isArray(data[key]) && data[key].length === numRows) {
                            const value = data[key][i];
                            if (!isNaN(Number(value)) && String(value).trim() !== '') {
                                row[key] = Number(value);
                            } else {
                                row[key] = value;
                            }
                         }
                    }
                    result.push(row);
                }
                if (result.length > 0) return result;
            }
            throw new Error("JSON is not an array of objects or a supported format.");
        }
        if (data.length > 0 && typeof data[0] !== 'object') {
             throw new Error("JSON is not an array of objects.");
        }
        // Convert numeric strings to numbers
        return data.map(row => {
            const newRow: Record<string, string | number> = {};
            for (const key in row) {
                const value = row[key];
                if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
                    newRow[key] = Number(value);
                } else {
                    newRow[key] = value;
                }
            }
            return newRow;
        });
    } catch (error) {
        throw new Error("Invalid JSON format.");
    }
}

export function parseCsv(content: string): ParsedData {
  try {
    const lines = content.trim().split(/\r\n|\n/);
    if (lines.length < 2) {
      throw new Error("CSV must have a header and at least one data row.");
    }

    const header = lines[0].split(',').map(h => h.trim());
    const data: ParsedData = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',');
      if (values.length !== header.length) {
        console.warn(`Row ${i+1} has incorrect number of columns. Skipping.`);
        continue;
      }
      
      const rowObject: Record<string, string | number> = {};
      header.forEach((key, index) => {
        const value = values[index].trim();
        if (!isNaN(Number(value)) && value.trim() !== '') {
          rowObject[key] = Number(value);
        } else {
          rowObject[key] = value;
        }
      });
      data.push(rowObject);
    }
    return data;
  } catch (error) {
    throw new Error("Failed to parse CSV file.");
  }
}
