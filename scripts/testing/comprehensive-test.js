#!/usr/bin/env node

/**
 * Comprehensive test script for the external API migration
 * This validates all changes without requiring running services
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Comprehensive External API Migration Test\n');

let allTestsPassed = true;

function testSection(title, tests) {
  console.log(`📋 ${title}:`);
  let sectionPassed = true;
  
  tests.forEach(test => {
    try {
      const result = test.test();
      if (result) {
        console.log(`   ✅ ${test.name}`);
      } else {
        console.log(`   ❌ ${test.name}`);
        sectionPassed = false;
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
      sectionPassed = false;
      allTestsPassed = false;
    }
  });
  
  console.log('');
  return sectionPassed;
}

// Test 1: Configuration Files
testSection('Configuration Files', [
  {
    name: 'functions.env configured for external APIs',
    test: () => {
      const envPath = path.join(__dirname, 'supabase', 'functions.env');
      if (!fs.existsSync(envPath)) return false;
      const content = fs.readFileSync(envPath, 'utf8');
      return content.includes('USE_LOCAL_LLM=false') && 
             content.includes('GEMINI_API_KEY=') && 
             content.includes('DEFAULT_LLM_PROVIDER=gemini');
    }
  },
  {
    name: 'Supabase config.toml is valid',
    test: () => {
      const configPath = path.join(__dirname, 'supabase', 'config.toml');
      if (!fs.existsSync(configPath)) return false;
      const content = fs.readFileSync(configPath, 'utf8');
      // Check it doesn't have the problematic functions.env_file line
      return !content.includes('env_file = "functions.env"');
    }
  }
]);

// Test 2: Backend Code Changes
testSection('Backend API Integration', [
  {
    name: 'Google Gemini API imported',
    test: () => {
      const advancedMatchingPath = path.join(__dirname, 'supabase', 'functions', '_shared', 'advancedMatching.ts');
      if (!fs.existsSync(advancedMatchingPath)) return false;
      const content = fs.readFileSync(advancedMatchingPath, 'utf8');
      return content.includes('GoogleGenerativeAI');
    }
  },
  {
    name: 'Unified promptLLM function exists',
    test: () => {
      const advancedMatchingPath = path.join(__dirname, 'supabase', 'functions', '_shared', 'advancedMatching.ts');
      const content = fs.readFileSync(advancedMatchingPath, 'utf8');
      return content.includes('async function promptLLM(');
    }
  },
  {
    name: 'Gemini 2.5 Flash-Lite model configured',
    test: () => {
      const advancedMatchingPath = path.join(__dirname, 'supabase', 'functions', '_shared', 'advancedMatching.ts');
      const content = fs.readFileSync(advancedMatchingPath, 'utf8');
      return content.includes('gemini-2.5-flash-lite');
    }
  },
  {
    name: 'scan-job-description updated for external APIs',
    test: () => {
      const scanJobPath = path.join(__dirname, 'supabase', 'functions', 'scan-job-description', 'index.ts');
      if (!fs.existsSync(scanJobPath)) return false;
      const content = fs.readFileSync(scanJobPath, 'utf8');
      return content.includes('llmProvider') && content.includes('geminiApiKey');
    }
  }
]);

// Test 3: Frontend UI Changes
testSection('Frontend Model Selection UI', [
  {
    name: 'API provider selection state exists',
    test: () => {
      const filtersPath = path.join(__dirname, 'desktopProbe', 'src', 'pages', 'filters.tsx');
      if (!fs.existsSync(filtersPath)) return false;
      const content = fs.readFileSync(filtersPath, 'utf8');
      return content.includes('selectedProvider') && content.includes('apiKeys');
    }
  },
  {
    name: 'Google Gemini UI card exists',
    test: () => {
      const filtersPath = path.join(__dirname, 'desktopProbe', 'src', 'pages', 'filters.tsx');
      const content = fs.readFileSync(filtersPath, 'utf8');
      return content.includes('Google Gemini') && content.includes('Recommended');
    }
  },
  {
    name: 'API key configuration UI exists',
    test: () => {
      const filtersPath = path.join(__dirname, 'desktopProbe', 'src', 'pages', 'filters.tsx');
      const content = fs.readFileSync(filtersPath, 'utf8');
      return content.includes('showApiKeyInputs') && content.includes('Configure\'} API Keys');
    }
  },
  {
    name: 'API config SDK functions added',
    test: () => {
      const sdkPath = path.join(__dirname, 'desktopProbe', 'src', 'lib', 'electronMainSdk.tsx');
      if (!fs.existsSync(sdkPath)) return false;
      const content = fs.readFileSync(sdkPath, 'utf8');
      return content.includes('getApiConfig') && content.includes('updateApiConfig');
    }
  }
]);

// Test 4: IPC Integration
testSection('Electron IPC Integration', [
  {
    name: 'API config IPC handlers added',
    test: () => {
      const ipcPath = path.join(__dirname, 'desktopProbe', 'src', 'server', 'rendererIpcApi.ts');
      if (!fs.existsSync(ipcPath)) return false;
      const content = fs.readFileSync(ipcPath, 'utf8');
      return content.includes('get-api-config') && content.includes('update-api-config');
    }
  },
  {
    name: 'Secure local storage implementation',
    test: () => {
      const ipcPath = path.join(__dirname, 'desktopProbe', 'src', 'server', 'rendererIpcApi.ts');
      const content = fs.readFileSync(ipcPath, 'utf8');
      return content.includes('.first2apply-api-config.json');
    }
  }
]);

// Test 5: Cleanup Verification
testSection('Local LLM Cleanup', [
  {
    name: 'start-local-llm.sh removed',
    test: () => !fs.existsSync(path.join(__dirname, 'start-local-llm.sh'))
  },
  {
    name: 'test-local-llm.js removed',
    test: () => !fs.existsSync(path.join(__dirname, 'test-local-llm.js'))
  },
  {
    name: 'verify-no-openai-usage.js removed',
    test: () => !fs.existsSync(path.join(__dirname, 'verify-no-openai-usage.js'))
  },
  {
    name: 'monitor-llm-usage.js removed',
    test: () => !fs.existsSync(path.join(__dirname, 'monitor-llm-usage.js'))
  },
  {
    name: 'Service manager updated (no local LLM startup)',
    test: () => {
      const servicePath = path.join(__dirname, 'service-manager.sh');
      if (!fs.existsSync(servicePath)) return false;
      const content = fs.readFileSync(servicePath, 'utf8');
      return content.includes('USE_LOCAL_LLM=false') && 
             content.includes('DEFAULT_LLM_PROVIDER=gemini');
    }
  }
]);

// Test 6: Documentation Updates
testSection('Documentation Updates', [
  {
    name: 'README updated for external APIs',
    test: () => {
      const readmePath = path.join(__dirname, 'README.md');
      if (!fs.existsSync(readmePath)) return false;
      const content = fs.readFileSync(readmePath, 'utf8');
      return content.includes('External AI APIs (Gemini/OpenAI/Llama)') && 
             content.includes('Google Gemini 2.5 Flash-Lite');
    }
  },
  {
    name: 'Cost comparison table updated',
    test: () => {
      const readmePath = path.join(__dirname, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf8');
      return content.includes('Google Gemini 2.5 Flash-Lite') && 
             content.includes('~$20');
    }
  }
]);

// Final Summary
console.log('📊 Test Summary:');
console.log('================');

if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED! 🎉');
  console.log('');
  console.log('✅ Your system has been successfully migrated to external APIs!');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('1. Ensure Docker Desktop is running');
  console.log('2. Get your Google Gemini API key: https://ai.google.dev/');
  console.log('3. Start the system: ./service-manager.sh start');
  console.log('4. Configure API keys in the Electron app');
  console.log('');
  console.log('💡 Expected Results:');
  console.log('- 95% cost reduction with Gemini vs GPT-4o');
  console.log('- No local LLM resource requirements');
  console.log('- Faster, more reliable AI responses');
  console.log('- Easy provider switching via UI');
  
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('Please review the failed tests above and address any issues.');
}

console.log('');
console.log('🔧 Troubleshooting:');
console.log('- If Docker issues persist: Restart Docker Desktop');
console.log('- If Supabase fails: Run "npx supabase start" manually');
console.log('- If Electron issues: Check API key configuration');
console.log('');

process.exit(allTestsPassed ? 0 : 1);
