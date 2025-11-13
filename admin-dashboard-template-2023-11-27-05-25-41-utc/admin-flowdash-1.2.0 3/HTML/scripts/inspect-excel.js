const xlsx = require('xlsx');

// Read Combined Objectives
console.log('=== Combined Objectives.xlsx ===');
const wb1 = xlsx.readFile('data-source/Combined Objectives.xlsx');
console.log('Sheet names:', wb1.SheetNames);
const ws1 = wb1.Sheets[wb1.SheetNames[0]];
const data1 = xlsx.utils.sheet_to_json(ws1);
console.log('Total rows:', data1.length);
console.log('First row keys:', Object.keys(data1[0] || {}));
console.log('First 3 rows:');
console.log(JSON.stringify(data1.slice(0, 3), null, 2));

console.log('\n=== INLC_Strategic_Plan_Tracking.xlsx ===');
const wb2 = xlsx.readFile('data-source/INLC_Strategic_Plan_Tracking.xlsx');
console.log('Sheet names:', wb2.SheetNames);
const ws2 = wb2.Sheets[wb2.SheetNames[0]];
const data2 = xlsx.utils.sheet_to_json(ws2);
console.log('Total rows:', data2.length);
console.log('First row keys:', Object.keys(data2[0] || {}));
console.log('First 3 rows:');
console.log(JSON.stringify(data2.slice(0, 3), null, 2));
