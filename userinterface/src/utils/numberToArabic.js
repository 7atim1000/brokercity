// utils/numberToArabic.js

export const numberToArabicWords = (num) => {
    if (num === 0) return 'صفر';
    
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    const thousands = ['', 'ألف', 'ألفان', 'آلاف', 'ألف'];
    const millions = ['', 'مليون', 'مليونان', 'ملايين', 'مليون'];
    
    const convertLessThanThousand = (n) => {
        if (n === 0) return '';
        
        let result = '';
        const h = Math.floor(n / 100);
        const remainder = n % 100;
        
        if (h > 0) {
            result += hundreds[h];
            if (remainder > 0) result += ' و';
        }
        
        if (remainder > 0) {
            if (remainder < 10) {
                result += ones[remainder];
            } else if (remainder < 20) {
                if (remainder === 10) result += 'عشرة';
                else if (remainder === 11) result += 'أحد عشر';
                else if (remainder === 12) result += 'اثنا عشر';
                else if (remainder === 13) result += 'ثلاثة عشر';
                else if (remainder === 14) result += 'أربعة عشر';
                else if (remainder === 15) result += 'خمسة عشر';
                else if (remainder === 16) result += 'ستة عشر';
                else if (remainder === 17) result += 'سبعة عشر';
                else if (remainder === 18) result += 'ثمانية عشر';
                else if (remainder === 19) result += 'تسعة عشر';
            } else {
                const t = Math.floor(remainder / 10);
                const o = remainder % 10;
                if (o > 0) {
                    result += ones[o] + ' و' + tens[t];
                } else {
                    result += tens[t];
                }
            }
        }
        
        return result;
    };
    
    const convert = (n) => {
        if (n === 0) return 'صفر';
        
        let result = '';
        const mil = Math.floor(n / 1000000);
        const th = Math.floor((n % 1000000) / 1000);
        const rest = n % 1000;
        
        if (mil > 0) {
            if (mil === 1) result += 'مليون';
            else if (mil === 2) result += 'مليونان';
            else if (mil >= 3 && mil <= 10) result += convertLessThanThousand(mil) + ' ملايين';
            else result += convertLessThanThousand(mil) + ' مليون';
            if (th > 0 || rest > 0) result += ' و';
        }
        
        if (th > 0) {
            if (th === 1) result += 'ألف';
            else if (th === 2) result += 'ألفان';
            else if (th >= 3 && th <= 10) result += convertLessThanThousand(th) + ' آلاف';
            else result += convertLessThanThousand(th) + ' ألف';
            if (rest > 0) result += ' و';
        }
        
        if (rest > 0) {
            result += convertLessThanThousand(rest);
        }
        
        return result;
    };
    
    // Handle decimal places (fractions)
    const numStr = num.toString();
    const parts = numStr.split('.');
    const integerPart = parseInt(parts[0]);
    const decimalPart = parts[1] ? parseInt(parts[1]) : 0;
    
    let result = convert(integerPart);
    
    // Add currency and fractions
    if (decimalPart > 0) {
        // Round to 2 decimal places for currency
        const roundedDecimal = Math.round(decimalPart / Math.pow(10, parts[1].length - 2));
        const decimalWords = convert(roundedDecimal);
        result += ` و ${decimalWords} فلساً`;
    }
    
    return result;
};

export const formatAmountInWords = (amount) => {
    if (!amount || amount === 0) return '';
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return '';
    return numberToArabicWords(num);
};