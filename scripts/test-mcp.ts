#!/usr/bin/env tsx

/**
 * MCP Test Client
 * Tests the MCP SSE endpoint
 */

// Test POST requests to MCP endpoint
async function testMcpEndpoint() {
  const baseUrl = 'http://localhost:3000/api/mcp';

  console.log('🧪 Testing MCP Endpoint...\n');

  // Test 1: List all resources
  console.log('1️⃣ Testing resources/list...');
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/list',
        params: {}
      })
    });

    const data = await response.json();
    console.log('✅ resources/list:', data.result?.resources?.length || 0, 'resources found');
    if (data.result?.resources?.length > 0) {
      console.log('   First resource:', data.result.resources[0].name);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log();

  // Test 2: Read a specific resource (if any exist)
  console.log('2️⃣ Testing resources/read...');
  try {
    // First get list to find a resource
    const listResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/list',
        params: {}
      })
    });

    const listData = await listResponse.json();
    if (listData.result?.resources?.length > 0) {
      const firstResource = listData.result.resources[0];
      const uri = firstResource.uri;

      const readResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'resources/read',
          params: { uri }
        })
      });

      const readData = await readResponse.json();
      if (readData.result?.contents?.[0]?.text) {
        const content = readData.result.contents[0].text;
        console.log('✅ resources/read:', uri);
        console.log('   Content length:', content.length, 'characters');
        console.log('   First 100 chars:', content.substring(0, 100));
      } else {
        console.log('❌ No content returned');
      }
    } else {
      console.log('⚠️  No resources available to test');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log();

  // Test 3: Search resources
  console.log('3️⃣ Testing resources/search...');
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'resources/search',
        params: {
          query: 'research'
        }
      })
    });

    const data = await response.json();
    console.log('✅ resources/search:', data.result?.resources?.length || 0, 'resources found');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log();

  // Test 4: Test SSE stream (just connect and disconnect)
  console.log('4️⃣ Testing SSE stream (GET)...');
  try {
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: { 'Accept': 'text/event-stream' }
    });

    if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
      console.log('✅ SSE stream connected');
      
      // Read first few messages
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let count = 0;
        
        while (count < 3) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          if (text.startsWith('data:')) {
            console.log('   Received:', text.substring(0, 80) + '...');
            count++;
          }
        }
        
        reader.cancel();
      }
    } else {
      console.log('❌ SSE stream failed to connect');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log();
  console.log('✅ MCP endpoint tests complete!');
}

// Run tests
testMcpEndpoint().catch(console.error);
