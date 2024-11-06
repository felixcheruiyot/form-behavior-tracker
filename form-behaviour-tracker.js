// Add CSS for autofill detection (can be injected or added in a stylesheet)
const style = document.createElement('style');
style.innerHTML = `
    input:-webkit-autofill {
        animation: autofill-detection 0.001s forwards;
    }
    @keyframes autofill-detection {
        from {}
        to {}
    }
`;
document.head.appendChild(style);

class FormTracker {
    constructor(targetFields, formId) {
        this.targetFields = targetFields; // Fields to track
        this.data = {
            autofill: [],
            pasting: [],
            duration: {},
            iterations: {}
        };
        this.startTimes = {}; // Track field focus times
        this.previousValues = {}; // Store previous field values
        this.typeTimeouts = {}; // Track typing timeouts
        this.formId = formId; // Form ID for submission check
        this.setupListeners();
    }

    setupListeners() {
        this.targetFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);

            if (field) {
                // Initialize previous value and iterations count
                this.previousValues[fieldId] = field.value;
                this.data.iterations[fieldId] = 0;

                // Focus event to start timing and detect autofill
                field.addEventListener("focus", () => {
                    this.startTimes[fieldId] = Date.now();
                    if (field.value && !this.data.autofill.includes(fieldId) && !this.data.iterations[fieldId]) {
                        this.data.autofill.push(fieldId);
                    }
                });

                // Blur event to calculate duration and check for iterations
                field.addEventListener("blur", () => {
                    const duration = (Date.now() - this.startTimes[fieldId]) / 1000;
                    this.data.duration[fieldId] = (this.data.duration[fieldId] || 0) + duration;

                    // If the user leaves the field, check for any last iterations
                    if (field.value !== this.previousValues[fieldId]) {
                        this.data.iterations[fieldId] += 1; // Increment on blur if changed
                    }
                });

                // Input event to track changes and detect iterations
                field.addEventListener("input", () => {
                    if (field.value !== this.previousValues[fieldId]) {
                        // Reset previous value on input
                        this.previousValues[fieldId] = field.value;

                        // Clear any existing timeout and set a new one
                        clearTimeout(this.typeTimeouts[fieldId]);
                        this.typeTimeouts[fieldId] = setTimeout(() => {
                            // Increment iteration after a pause in typing
                            this.data.iterations[fieldId] += 1;
                        }, 1000); // 1 second pause
                    }
                });

                // Detect paste action
                field.addEventListener("paste", () => {
                    if (!this.data.pasting.includes(fieldId)) {
                        this.data.pasting.push(fieldId);
                    }
                });

                // Detect autofill using CSS animation
                field.addEventListener("animationstart", (event) => {
                    if (event.animationName === "autofill-detection" && !this.data.autofill.includes(fieldId)) {
                        this.data.autofill.push(fieldId);
                    }
                });

                // Detect changes made without focus (alternative autofill detection)
                const observer = new MutationObserver(() => {
                    if (document.activeElement !== field && field.value !== this.previousValues[fieldId]) {
                        if (!this.data.autofill.includes(fieldId)) {
                            this.data.autofill.push(fieldId);
                        }
                        this.previousValues[fieldId] = field.value;
                    }
                });
                observer.observe(field, { attributes: true, attributeFilter: ["value"] });
            }
        });

        // Form submission check for any remaining undetected autofills
        const form = document.getElementById(this.formId);
        if (form) {
            form.addEventListener("submit", () => {
                this.targetFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field && field.value && this.data.iterations[fieldId] === 0) {
                        // If no user input was detected, assume autofill
                        if (!this.data.autofill.includes(fieldId)) {
                            this.data.autofill.push(fieldId);
                        }
                    }
                });
            });
        }
    }

    // Function to get the results in encoded base64 JSON format
    getResults() {
        const encodedData = btoa(JSON.stringify(this.data));
        return encodedData;
    }

    // Get results in JSON format
    getResultsJSON() {
        return this.data;
    }

    // Reset data if needed
    resetData() {
        this.data = {
            autofill: [],
            pasting: [],
            duration: {},
            iterations: {}
        };
        this.previousValues = {};
        this.typeTimeouts = {};
    }
}
