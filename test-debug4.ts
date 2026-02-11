const priorityOrder = { primary: 0, secondary: 1, fallback: 2, emergency: 3 };

console.log('priorityOrder["emergency"]:', priorityOrder['emergency']);
console.log('priorityOrder["primary"]:', priorityOrder['primary']);
console.log('diff:', priorityOrder['emergency'] - priorityOrder['primary']);

// Test the actual logic from model-factory
const a = { priority: 'emergency' };
const b = { priority: 'primary' };
const diff = (priorityOrder[a.priority || 'primary'] || 99) - 
             (priorityOrder[b.priority || 'primary'] || 99);
console.log('Actual diff:', diff);
