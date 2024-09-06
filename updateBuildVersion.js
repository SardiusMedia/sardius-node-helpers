// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

/* 
  Copies the version from the root package.json file to the build package.json
*/

// Read the source JSON file
fs.readFile('./package.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading source file:', err);
    return;
  }

  const destinationFile = './build/package.json'; // Destination file path

  // Parse the source file as JSON
  const sourceJson = JSON.parse(data);

  const valueToTransfer = sourceJson.version;

  // Read the destination JSON file
  fs.readFile(destinationFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading destination file:', err);
      return;
    }

    // Parse the destination file as JSON
    const destinationJson = JSON.parse(data);

    // Modify the destination JSON
    destinationJson.version = valueToTransfer;

    // Write the updated JSON back to the destination file
    fs.writeFile(
      destinationFile,
      JSON.stringify(destinationJson, null, 2),
      'utf8',
      err => {
        if (err) {
          console.error('Error writing to destination file:', err);
          return;
        }
        console.log('JSON updated successfully.');
      },
    );
  });
});
