#!/usr/bin/env node

import axios from 'axios';

console.log('=== Testing Streaming API Response ===\n');

const config = {
  baseUrl: 'https://api.qnaigc.com',
  authToken: 'sk-2dd63001b32cf7d9186be3d6673eedb3005a0dcfa6b0be1d00c6395173f4e348',
  model: 'minimax/minimax-m2.5'
};

const testPayload = {
  model: config.model,
  max_tokens: 100,
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant. Respond with 'Configuration test successful!'"
    },
    {
      role: "user",
      content: "Test message to verify API connectivity"
    }
  ],
  stream: true
};

console.log('Making streaming request...');

try {
  const response = await axios.post(
    `${config.baseUrl}/v1/messages`,
    testPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
        'anthropic-version': '2023-06-01'
      },
      timeout: 10000,
      responseType: 'stream'
    }
  );

  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  
  console.log('\n=== Streaming Response Chunks ===\n');
  
  let fullResponse = '';
  let chunkCount = 0;
  
  response.data.on('data', (chunk) => {
    chunkCount++;
    const chunkStr = chunk.toString();
    
    console.log(`Chunk ${chunkCount}:`);
    console.log(chunkStr);
    
    // Parse SSE format
    const lines = chunkStr.split('\n');
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullResponse += parsed.delta.text;
            }
          } catch (e) {
            // Not JSON
          }
        }
      }
    });
  });
  
  response.data.on('end', () => {
    console.log('\n=== Complete Response ===');
    console.log(`Total chunks: ${chunkCount}`);
    console.log(`Extracted text: "${fullResponse}"`);
    
    if (fullResponse.includes('Configuration test successful!')) {
      console.log('✅ Streaming test successful!');
    } else {
      console.log('⚠️ Streaming response not expected message');
      console.log(`Expected: "Configuration test successful!"`);
      console.log(`Got: "${fullResponse}"`);
    }
  });
  
  response.data.on('error', (error) => {
    console.log('❌ Stream error:', error.message);
  });

} catch (error) {
  console.log('❌ Error:', error.message);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', error.response.data);
  }
}