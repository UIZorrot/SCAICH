const fs = require('fs');

// Get the input filename from command line arguments
const inputFile = process.argv[2];

if (!inputFile) {
    console.log('Please specify the JS file to convert');
    console.log('Usage: node build.js filename.js');
    process.exit(1);
}

try {
    // 1. Import the component file
    const component = require('./' + inputFile);
    
    // 2. Get the exported content
    const content = Object.values(component)[0];
    
    // 3. Create output filename
    const outputFile = inputFile.replace('.js', '.json');
    
    // 4. Convert to JSON with proper formatting
    const jsonContent = JSON.stringify(content, null, 2);
    
    // 5. Write the JSON file
    fs.writeFileSync(outputFile, jsonContent);
    
    console.log(`Successfully generated ${outputFile}`);
    console.log('Component structure:');
    console.log('- HTML:', content.html ? '✓' : '✗');
    console.log('- CSS:', content.css ? '✓' : '✗');
    console.log('- JS:', content.js ? '✓' : '✗');

} catch (error) {
    console.error('Build failed:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
} 