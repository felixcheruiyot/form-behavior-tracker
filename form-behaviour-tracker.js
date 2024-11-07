if (typeof document !== 'undefined') {
    // Add CSS for autofill detection for Firefox and Chrome (inject or add to stylesheet)
    const style = document.createElement('style');
    style.innerHTML = `
        input:-webkit-autofill {
            animation: autofill-detection 0.001s forwards;
        }
        input:-moz-autofill {
            animation: autofill-detection 0.001s forwards;
        }
        @keyframes autofill-detection {
            from {}
            to {}
        }
    `;
    document.head.appendChild(style);
}

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

                // Focus event to start timing, detect autofill
                field.addEventListener("focus", () => {
                    this.startTimes[fieldId] = Date.now();

                    // Delay check for Firefox autofill detection
                    setTimeout(() => {
                        if (field.value && !this.data.autofill.includes(fieldId) && !this.data.iterations[fieldId]) {
                            this.data.autofill.push(fieldId);
                        }
                    }, 50); // Delay for autofill detection
                });

                // Blur event to calculate duration and check for iterations
                field.addEventListener("blur", () => {
                    const duration = (Date.now() - this.startTimes[fieldId]) / 1000;
                    this.data.duration[fieldId] = (this.data.duration[fieldId] || 0) + duration;

                    // Check for last iteration on blur if changed
                    if (field.value !== this.previousValues[fieldId]) {
                        this.data.iterations[fieldId] += 1;
                    }
                });

                // Input event to track changes and detect iterations
                field.addEventListener("input", () => {
                    if (field.value !== this.previousValues[fieldId]) {
                        // Reset previous value on input
                        this.previousValues[fieldId] = field.value;

                        // Clear existing timeout, set new one for iteration detection
                        clearTimeout(this.typeTimeouts[fieldId]);
                        this.typeTimeouts[fieldId] = setTimeout(() => {
                            this.data.iterations[fieldId] += 1; // Increment after typing pause
                        }, 3000);
                    }
                });

                // Detect paste action
                field.addEventListener("paste", () => {
                    if (!this.data.pasting.includes(fieldId)) {
                        this.data.pasting.push(fieldId);
                    }
                });

                // Detect autofill using CSS animation (for Chrome, Firefox)
                field.addEventListener("animationstart", (event) => {
                    if (event.animationName === "autofill-detection" && !this.data.autofill.includes(fieldId)) {
                        this.data.autofill.push(fieldId);
                    }
                });

                // Detect changes without focus (alternative autofill detection)
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

        // Final form submission check to catch undetected autofills
        const form = document.getElementById(this.formId);
        if (form) {
            form.addEventListener("submit", () => {
                this.targetFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field && field.value && this.data.iterations[fieldId] === 0) {
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
