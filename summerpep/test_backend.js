const { exec } = require('child_process');
const path = require('path');

const BACKEND_EXECUTABLE = path.join(__dirname, 'backend/build/social_network');

function testBackend() {
    console.log('Testing backend connectivity...\n');

    // Test 1: Add users
    console.log('Test 1: Adding users');
    exec(`"${BACKEND_EXECUTABLE}" add-user "alice"`, (error, stdout, stderr) => {
        console.log('Add alice:', stdout.trim());
        
        exec(`"${BACKEND_EXECUTABLE}" add-user "bob"`, (error, stdout, stderr) => {
            console.log('Add bob:', stdout.trim());
            
            // Test 2: Try to add duplicate user
            console.log('\nTest 2: Adding duplicate user');
            exec(`"${BACKEND_EXECUTABLE}" add-user "alice"`, (error, stdout, stderr) => {
                console.log('Add alice again:', stdout.trim());
                
                // Test 3: Try self-connection
                console.log('\nTest 3: Attempting self-connection');
                exec(`"${BACKEND_EXECUTABLE}" connect "alice" "alice"`, (error, stdout, stderr) => {
                    console.log('Connect alice to alice:', stdout.trim());
                    
                    // Test 4: Valid connection
                    console.log('\nTest 4: Valid connection');
                    exec(`"${BACKEND_EXECUTABLE}" connect "alice" "bob"`, (error, stdout, stderr) => {
                        console.log('Connect alice to bob:', stdout.trim());
                        
                        console.log('\n=== Backend Test Complete ===');
                    });
                });
            });
        });
    });
}

// Run the test
testBackend();
