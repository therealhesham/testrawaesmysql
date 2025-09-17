// Simple test script to verify the PDF processing flow
// Run with: node test-pdf-flow.js

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testPDFFlow() {
  console.log('🧪 Testing PDF Processing Flow...\n');

  try {
    // Test 1: Check if the API endpoints are accessible
    console.log('1. Testing API endpoint accessibility...');
    
    const endpoints = [
      '/api/process-pdf',
      '/api/gemini', 
      '/api/save-pdf-data'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET'
        });
        console.log(`   ✅ ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
      }
    }

    // Test 2: Test external APIs
    console.log('\n2. Testing external APIs...');
    
    // Test image extraction API
    try {
      const imageResponse = await fetch('https://extract.rawaes.com/extract-images', {
        method: 'GET' // Just test if endpoint is accessible
      });
      console.log(`   🖼️  Image extraction API: ${imageResponse.status === 405 ? 'Accessible (Method not allowed is expected)' : 'Status: ' + imageResponse.status}`);
    } catch (error) {
      console.log(`   ❌ Image extraction API error: ${error.message}`);
    }

    // Test Gemini API
    try {
      const geminiResponse = await fetch('https://aidoc.rawaes.com/api/gemini', {
        method: 'GET' // Just test if endpoint is accessible
      });
      console.log(`   🤖 Gemini API: ${geminiResponse.status === 405 ? 'Accessible (Method not allowed is expected)' : 'Status: ' + geminiResponse.status}`);
    } catch (error) {
      console.log(`   ❌ Gemini API error: ${error.message}`);
    }

    // Test 3: Test save endpoint
    console.log('\n3. Testing save endpoint...');
    
    try {
      const saveResponse = await fetch(`${BASE_URL}/api/save-pdf-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: 'test-session-id',
          selectedImages: ['test-image-url'],
          geminiData: { jsonResponse: { testField: 'testValue' } },
          originalFileName: 'test.pdf',
          notes: 'Test save operation',
          processedBy: 'Test User'
        })
      });

      if (saveResponse.ok) {
        const saveResult = await saveResponse.json();
        console.log('   ✅ Save endpoint working');
        console.log(`   💾 Save result: ${saveResult.message}`);
      } else {
        const error = await saveResponse.text();
        console.log(`   ❌ Save failed: ${error}`);
      }
    } catch (error) {
      console.log(`   ❌ Save error: ${error.message}`);
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure your development server is running (npm run dev)');
    console.log('   2. Set up your environment variables (GEMINI_API_KEY, DATABASE_URL)');
    console.log('   3. Run database migrations (npx prisma migrate dev)');
    console.log('   4. Test with a real PDF file at /admin/pdf-processor');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPDFFlow();
