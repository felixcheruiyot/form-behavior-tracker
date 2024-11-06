class FormTracker {
    constructor(targetFields) {
        this.targetFields = targetFields; // Fields to track
        this.data = {
            autofill: [],
            pasting: [],
            duration: {},
            iterations: {}
        };
        this.startTimes = {}; // Track field focus times
        this.setupListeners();
    }

    setupListeners() {
        this.targetFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);

            if (field) {
                // Focus event to start timing
                field.addEventListener("focus", () => {
                    this.startTimes[fieldId] = Date.now();
                });

                // Blur event to calculate duration
                field.addEventListener("blur", () => {
                    const duration = (Date.now() - this.startTimes[fieldId]) / 1000;
                    this.data.duration[fieldId] = (this.data.duration[fieldId] || 0) + duration;
                });

                // Input event to track changes
                field.addEventListener("input", () => {
                    this.data.iterations[fieldId] = (this.data.iterations[fieldId] || 0) + 1;
                });

                // Paste event
                field.addEventListener("paste", () => {
                    if (!this.data.pasting.includes(fieldId)) {
                        this.data.pasting.push(fieldId);
                    }
                });

                // Auto-fill detection
                field.addEventListener("change", (event) => {
                    if (event.isTrusted === false && !this.data.autofill.includes(fieldId)) {
                        this.data.autofill.push(fieldId);
                    }
                });
            }
        });
    }

    // Function to get the results in encoded base64 JSON format
    getResults() {
        const encodedData = btoa(JSON.stringify(this.data));
        return encodedData;
    }

    // Reset data if needed
    resetData() {
        this.data = {
            autofill: [],
            pasting: [],
            duration: {},
            iterations: {}
        };
    }
}
