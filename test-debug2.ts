import { modelFactory, getAllEnabledModels, getBestAvailableModel } from '@/lib/model-factory';

// Enable proxy mode
process.env.PROXY_ENABLED = 'true';

// Initialize
modelFactory.initialize();

console.log('Initial state:');
console.log(getAllEnabledModels().map(m => ({ id: m.id, priority: m.priority })));

// Set all to emergency
const allModels = getAllEnabledModels();
allModels.forEach(m => {
  modelFactory.setModelPriority(m.id, 'emergency');
});

console.log('\nAfter setting all to emergency:');
console.log(getAllEnabledModels().map(m => ({ id: m.id, priority: m.priority })));

// Set deepseek to primary
modelFactory.setModelPriority('deepseek', 'primary');

console.log('\nAfter setting deepseek to primary:');
console.log(getAllEnabledModels().map(m => ({ id: m.id, priority: m.priority })));

const best = getBestAvailableModel();
console.log('\nBest model:', best);
