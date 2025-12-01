const { parse } = require('csv-parse/sync');

class CSVParser {
  parseBankOfAmerica(csvContent) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records.map(record => ({
      date: this.parseDate(record.Date || record['Posted Date']),
      description: record.Description || record.Payee || '',
      amount: parseFloat(record.Amount || 0),
      institution: 'Bank of America',
      account_type: 'checking',
      original_data: JSON.stringify(record)
    }));
  }

  parseChase(csvContent) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records.map(record => ({
      date: this.parseDate(record['Transaction Date'] || record['Post Date']),
      description: record.Description || '',
      amount: parseFloat(record.Amount || 0),
      institution: 'Chase',
      account_type: record.Type === 'CREDIT' ? 'credit_card' : 'checking',
      original_data: JSON.stringify(record)
    }));
  }

  parseDiscover(csvContent) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records.map(record => ({
      date: this.parseDate(record['Trans. Date'] || record['Post Date']),
      description: record.Description || '',
      amount: -Math.abs(parseFloat(record.Amount || 0)),
      institution: 'Discover',
      account_type: 'credit_card',
      original_data: JSON.stringify(record)
    }));
  }

  parseAmex(csvContent) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records.map(record => ({
      date: this.parseDate(record.Date),
      description: record.Description || '',
      amount: -Math.abs(parseFloat(record.Amount || 0)),
      institution: 'American Express',
      account_type: 'credit_card',
      original_data: JSON.stringify(record)
    }));
  }

  parseGeneric(csvContent, institution = 'Unknown') {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    return records.map(record => {
      const keys = Object.keys(record);
      const dateField = keys.find(k => k.toLowerCase().includes('date'));
      const descField = keys.find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('payee'));
      const amountField = keys.find(k => k.toLowerCase().includes('amount'));

      return {
        date: this.parseDate(record[dateField] || ''),
        description: record[descField] || 'Unknown',
        amount: parseFloat(record[amountField] || 0),
        institution: institution,
        account_type: 'unknown',
        original_data: JSON.stringify(record)
      };
    });
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{1,2})-(\d{1,2})-(\d{4})/
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (match[0].includes('-') && match[1].length === 4) {
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          const month = match[1].padStart(2, '0');
          const day = match[2].padStart(2, '0');
          const year = match[3];
          return `${year}-${month}-${day}`;
        }
      }
    }

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Date parse error:', e);
    }

    return new Date().toISOString().split('T')[0];
  }

  detectInstitution(csvContent) {
    const firstLines = csvContent.split('\n').slice(0, 3).join('\n').toLowerCase();

    if (firstLines.includes('bank of america') || firstLines.includes('bofa')) {
      return 'bofa';
    } else if (firstLines.includes('chase')) {
      return 'chase';
    } else if (firstLines.includes('discover')) {
      return 'discover';
    } else if (firstLines.includes('american express') || firstLines.includes('amex')) {
      return 'amex';
    }

    return 'generic';
  }

  parse(csvContent, institution = null) {
    if (!institution) {
      institution = this.detectInstitution(csvContent);
    }

    switch (institution.toLowerCase()) {
      case 'bofa':
      case 'bank of america':
        return this.parseBankOfAmerica(csvContent);
      case 'chase':
        return this.parseChase(csvContent);
      case 'discover':
        return this.parseDiscover(csvContent);
      case 'amex':
      case 'american express':
        return this.parseAmex(csvContent);
      default:
        return this.parseGeneric(csvContent, institution);
    }
  }
}

module.exports = new CSVParser();
