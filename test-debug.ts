import { modelFactory, getAllEnabledModels, getBestAvailableModel, getModelConfig } from './src/lib/model-factory';

// Reset
(modelFactory as any)['initialized'] = false;
(modelFactory as any)['configCache'].clear();
(modelFactory as any)['configFile'] = null;

// Initialize
modelFactory.initialize();

// Enable proxy mode
process.env.PROXY_ENABLED = 'true';

// Set all to emergency
const allModels = getAllEnabledModels();
console.log('Before setting priorities:');
allModels.forEach(m => console.log(`  ${m.id}: ${m.priority}`));

allModels.forEach(m => {
  modelFactory.setModelPriority(m.id, 'emergency');
});

// Set deepseek to primary
modelFactory.setModelPriority('deepseek', 'primary');

// Check cache directly
console.log('\nCache contents:');
(modelFactory as any)['configCache'].forEach((config: any, id: string) => {
  console.log(`  ${id}: ${config.priority}`);
});

// Debug: Check available models before sorting
const available = Array.from((modelFactory as any)['configCache'].values())
  .filter((m: any) => m.enabled !== false && modelFactory.hasApiKey(m));
console.log('\nAvailable models before sort:');
available.forEach((m: any) => console.log(`  ${m.id}: ${m.priority}`));

// Sort manually to debug
const priorityOrder = { primary: 0, secondary: 1, fallback: 2, emergency: 3 };
available.sort((a: any, b: any) => {
  const aPriority = a.priority || 'primary';
  const bPriority = b.priority || 'primary';
  const aOrder = priorityOrder[aPriority as keyof typeof priorityOrder] ?? 99;
  const bOrder = priorityOrder[bPriority as keyof typeof priorityOrder] ?? 99;
  const priorityDiff = aOrder - bOrder;
  console.log(`  Comparing ${a.id}(${a.priority}=${aOrder}) vs ${b.id}(${b.priority}=${bOrder}): diff=${priorityDiff}`);
  return priorityDiff;
});
console.log('\nAvailable models after sort:');
available.forEach((m: any) => console.log(`  ${m.id}: ${m.priority}`));

// Get best
const best = getBestAvailableModel();
console.log('\nBest model:', best?.id, 'priority:', best?.priority);

// Get deepseek directly
const deepseek = getModelConfig('deepseek');
console.log('Deepseek from getModelConfig:', deepseek?.priority);
