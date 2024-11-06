# Behaviour tracker

## Example

  // Usage in any JS framework or vanilla JS
  const trackedFields = ["first_name", "card_number", "cvv", "address", "zip_code"];
  const tracker = new FormTracker(trackedFields);
  
  // Example: Get encoded results after form submission
  function getEncodedResults() {
      const results = tracker.getResults();
      console.log("Base64 Encoded Results:", results);
  }
