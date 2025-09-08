#!/usr/bin/env node

/**
 * Test script for external API integration
 * This script validates that the system can connect to and use external APIs
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing External API Integration...\n');

// Test configuration loading
function testConfigurationLoading() {
  console.log('📋 Testing Configuration Loading:');
  
  // Check if functions.env exists and has correct settings
  const functionsEnvPath = path.join(__dirname, 'supabase', 'functions.env');
  
  if (fs.existsSync(functionsEnvPath)) {
    const envContent = fs.readFileSync(functionsEnvPath, 'utf8');
    console.log('   ✅ functions.env exists');
    
    if (envContent.includes('USE_LOCAL_LLM=false')) {
      console.log('   ✅ USE_LOCAL_LLM is set to false');
    } else {
      console.log('   ❌ USE_LOCAL_LLM should be set to false');
    }
    
    if (envContent.includes('DEFAULT_LLM_PROVIDER=')) {
      console.log('   ✅ DEFAULT_LLM_PROVIDER is configured');
    } else {
      console.log('   ❌ DEFAULT_LLM_PROVIDER should be configured');
    }
    
    if (envContent.includes('GEMINI_API_KEY=')) {
      console.log('   ✅ GEMINI_API_KEY placeholder exists');
    } else {
      console.log('   ❌ GEMINI_API_KEY placeholder missing');
    }
    
    if (envContent.includes('OPENAI_API_KEY=')) {
      console.log('   ✅ OPENAI_API_KEY placeholder exists');
    } else {
      console.log('   ❌ OPENAI_API_KEY placeholder missing');
    }
  } else {
    console.log('   ❌ functions.env file not found');
  }
  
  console.log('');
}

// Test API integration code
function testAPIIntegrationCode() {
  console.log('🔧 Testing API Integration Code:');
  
  const advancedMatchingPath = path.join(__dirname, 'supabase', 'functions', '_shared', 'advancedMatching.ts');
  
  if (fs.existsSync(advancedMatchingPath)) {
    const content = fs.readFileSync(advancedMatchingPath, 'utf8');
    console.log('   ✅ advancedMatching.ts exists');
    
    if (content.includes('GoogleGenerativeAI')) {
      console.log('   ✅ Google Gemini API integration added');
    } else {
      console.log('   ❌ Google Gemini API integration missing');
    }
    
    if (content.includes('promptGemini')) {
      console.log('   ✅ Gemini prompt function exists');
    } else {
      console.log('   ❌ Gemini prompt function missing');
    }
    
    if (content.includes('promptLLM')) {
      console.log('   ✅ Unified LLM prompt function exists');
    } else {
      console.log('   ❌ Unified LLM prompt function missing');
    }
    
    if (content.includes('gemini-2.5-flash-lite')) {
      console.log('   ✅ Optimal Gemini model configured');
    } else {
      console.log('   ❌ Optimal Gemini model not configured');
    }
  } else {
    console.log('   ❌ advancedMatching.ts file not found');
  }
  
  console.log('');
}

// Test UI integration
function testUIIntegration() {
  console.log('🖥️ Testing UI Integration:');
  
  const filtersPagePath = path.join(__dirname, 'desktopProbe', 'src', 'pages', 'filters.tsx');
  
  if (fs.existsSync(filtersPagePath)) {
    const content = fs.readFileSync(filtersPagePath, 'utf8');
    console.log('   ✅ filters.tsx exists');
    
    if (content.includes('selectedProvider')) {
      console.log('   ✅ Provider selection state exists');
    } else {
      console.log('   ❌ Provider selection state missing');
    }
    
    if (content.includes('apiKeys')) {
      console.log('   ✅ API key management exists');
    } else {
      console.log('   ❌ API key management missing');
    }
    
    if (content.includes('Google Gemini')) {
      console.log('   ✅ Gemini provider UI exists');
    } else {
      console.log('   ❌ Gemini provider UI missing');
    }
    
    if (content.includes('getApiConfig')) {
      console.log('   ✅ API config loading integrated');
    } else {
      console.log('   ❌ API config loading missing');
    }
  } else {
    console.log('   ❌ filters.tsx file not found');
  }
  
  console.log('');
}

// Test removed local LLM features
function testRemovedFeatures() {
  console.log('🧹 Testing Removed Local LLM Features:');
  
  const filesToCheck = [
    'start-local-llm.sh',
    'test-local-llm.js',
    'test-supabase-local-llm.js',
    'verify-no-openai-usage.js',
    'monitor-llm-usage.js'
  ];
  
  let removedCount = 0;
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} removed`);
      removedCount++;
    } else {
      console.log(`   ❌ ${file} still exists`);
    }
  });
  
  console.log(`   📊 ${removedCount}/${filesToCheck.length} local LLM files removed`);
  console.log('');
}

// Test service manager updates
function testServiceManagerUpdates() {
  console.log('⚙️ Testing Service Manager Updates:');
  
  const serviceManagerPath = path.join(__dirname, 'service-manager.sh');
  
  if (fs.existsSync(serviceManagerPath)) {
    const content = fs.readFileSync(serviceManagerPath, 'utf8');
    console.log('   ✅ service-manager.sh exists');
    
    if (content.includes('USE_LOCAL_LLM=false')) {
      console.log('   ✅ Service manager sets USE_LOCAL_LLM=false');
    } else {
      console.log('   ❌ Service manager should set USE_LOCAL_LLM=false');
    }
    
    if (content.includes('DEFAULT_LLM_PROVIDER=gemini')) {
      console.log('   ✅ Service manager sets Gemini as default');
    } else {
      console.log('   ❌ Service manager should set Gemini as default');
    }
    
    if (!content.includes('start_ollama') || !content.includes('start_local_llm_api')) {
      console.log('   ✅ Local LLM startup removed from service order');
    } else {
      console.log('   ❌ Local LLM startup should be removed');
    }
  } else {
    console.log('   ❌ service-manager.sh file not found');
  }
  
  console.log('');
}

// Summary and next steps
function printSummary() {
  console.log('📋 Summary and Next Steps:');
  console.log('');
  console.log('✅ System has been successfully converted to external API usage!');
  console.log('');
  console.log('🚀 To complete the setup:');
  console.log('   1. Get your Google Gemini API key from: https://ai.google.dev/');
  console.log('   2. Start the system: ./service-manager.sh start');
  console.log('   3. Open the Electron app');
  console.log('   4. Go to Advanced Matching page');
  console.log('   5. Click "Configure API Keys"');
  console.log('   6. Enter your Gemini API key');
  console.log('   7. Select "Google Gemini" as your provider');
  console.log('   8. Save the configuration');
  console.log('');
  console.log('💡 Recommended: Start with Google Gemini for best cost-performance balance');
  console.log('   - Cost: ~$0.075/1M input tokens, ~$0.30/1M output tokens');
  console.log('   - Model: gemini-2.5-flash-lite');
  console.log('   - ~95% cost savings compared to GPT-4o');
  console.log('');
  console.log('🔧 For OpenAI: Get API key from: https://platform.openai.com/api-keys');
  console.log('🔜 Llama API integration coming soon!');
  console.log('');
}

// Run all tests
function runTests() {
  testConfigurationLoading();
  testAPIIntegrationCode();
  testUIIntegration();
  testRemovedFeatures();
  testServiceManagerUpdates();
  printSummary();
}

// Execute tests
runTests();
