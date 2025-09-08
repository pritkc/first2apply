const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Function to call Ollama model using HTTP API
async function callOllamaAPI(prompt) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      model: 'llama3.2:3b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0,
        top_p: 0.1
      }
    });

    const curlCommand = `curl -s -X POST http://localhost:11434/api/generate -H "Content-Type: application/json" -d '${requestData.replace(/'/g, "'\"'\"'")}'`;
    
    exec(curlCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Ollama API call failed: ${error.message}`));
        return;
      }
      
      if (stderr) {
        console.warn('Ollama stderr:', stderr);
      }
      
      try {
        const response = JSON.parse(stdout);
        if (response.response) {
          resolve(response.response);
        } else {
          reject(new Error('No response from Ollama API'));
        }
      } catch (parseError) {
        reject(new Error(`Failed to parse Ollama response: ${parseError.message}`));
      }
    });
  });
}

// OpenAI-compatible endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;
    
    // Extract the user message (job filtering prompt)
    const userMessage = messages.find(msg => msg.role === 'user');
    const systemMessage = messages.find(msg => msg.role === 'system');
    
    if (!userMessage) {
      return res.status(400).json({ error: 'No user message found' });
    }
    
    // Combine system and user prompts
    const fullPrompt = `${systemMessage ? systemMessage.content + '\n\n' : ''}${userMessage.content}

Please respond ONLY with a valid JSON object containing:
- excluded: boolean (true if the job should be excluded, false otherwise)  
- reason: string (the reason why the job should be excluded; leave empty if not excluded)

Do not include any other text, explanations, or markdown formatting. Just the JSON object.`;

    console.log('Processing job filtering request...');
    
    const startTime = Date.now();
    const response = await callOllamaAPI(fullPrompt);
    const endTime = Date.now();
    
    console.log(`Ollama response time: ${endTime - startTime}ms`);
    
    // Try to extract JSON from the response
    let jsonMatch = response.match(/\{[\s\S]*\}/);
    let parsedResponse;
    
    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse JSON:', jsonMatch[0]);
        // Fallback response
        parsedResponse = {
          excluded: false,
          reason: ''
        };
      }
    } else {
      // If no JSON found, try to determine from text
      const lowerResponse = response.toLowerCase();
      parsedResponse = {
        excluded: lowerResponse.includes('exclude') || lowerResponse.includes('true'),
        reason: lowerResponse.includes('exclude') ? 'Job excluded based on criteria' : ''
      };
    }
    
    // Estimate token usage (rough approximation)
    const inputTokens = Math.ceil(fullPrompt.length / 4);
    const outputTokens = Math.ceil(response.length / 4);
    
    // Return OpenAI-compatible response
    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'llama3.2:3b',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify(parsedResponse)
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens
      }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', model: 'llama3.2:3b' });
});

app.listen(PORT, () => {
  console.log(`Local LLM API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`OpenAI-compatible endpoint: http://localhost:${PORT}/v1/chat/completions`);
});
