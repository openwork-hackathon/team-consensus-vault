import { modelFactory, getAllEnabledModels, getBestAvailableModel } from '@/lib/model-factory';

// Enable proxy mode
process.env.PROXY_ENABLED = 'true';

// Initialize
modelFactory.initialize();

// Set all to emergency
const allModels = getAllEnabledModels();
allModels.forEach(m => {
  modelFactory.setModelPriority(m.id, 'emergency');
});

// Set deepseek to primary
modelFactory.setModelPriority('deepseek', 'primary');

console.log('All models after setting priorities:');
const models = getAllEnabledModels();
models.forEach(m => {
  console.log(`  ${m.id}: priority=${m.priority}, hasKey=${modelFactory.hasApiKey(m)}`);
});

// Test the sorting logic
const priorityOrder = { primary: 0, secondary: 1, fallback: 2, emergency: 3 };
const sorted = [...models].sort((a, b) => {
  const priorityDiff = (priorityOrder[a.priority || 'primary'] || 99) - 
                      (priorityOrder[b.priority || 'primary'] || 99);
  console.log(`Comparing ${a.id} (${a.priority}) vs ${b.id} (${b.priority}): diff=${priorityDiff}`);
  return priorityDiff;
});

console.log('\nSorted models:');
sorted.forEach(m => console.log(`  ${m.id}: priority=${m.priority}`));

const best = getBestAvailableModel();
console.log('\nBest model:', best?.id, 'priority:', best?.priority);
