function collectAllErrors() {
    // Initialize arrays to store different types of errors
    const collectedErrors = {
        consoleErrors: [],
        consoleWarnings: [],
        uncaughtExceptions: [],
        failedPromises: [],
        networkErrors: [],
        iframeErrors: [],
        customElementErrors: [] // New array for custom element errors
    };

    // Function to send collected errors back to the extension
    function sendErrorsToExtension() {
        document.dispatchEvent(new CustomEvent('AllErrorsCollected', {
            detail: collectedErrors
        }));
    }

    // Collect existing console errors and warnings from the browser's console history if available
    if (window.console && window.console._errorHistory) {
        collectedErrors.consoleErrors = window.console._errorHistory.slice();
    }
    
    if (window.console && window.console._warningHistory) {
        collectedErrors.consoleWarnings = window.console._warningHistory.slice();
    }

    // Collect network errors from performance entries
    if (window.performance && window.performance.getEntries) {
        const resources = window.performance.getEntries();
        
        resources.forEach(resource => {
            if (resource.entryType === 'resource' && 
                (resource.responseStatus >= 400 || resource.duration === 0 || resource.transferSize === 0)) {
                collectedErrors.networkErrors.push({
                    url: resource.name,
                    type: resource.initiatorType,
                    status: resource.responseStatus || 'Unknown',
                    time: new Date(resource.startTime).toISOString()
                });
            }
        });
    }

    // Collect any errors stored in window._uncaughtExceptions if our error handler set it up
    if (window._uncaughtExceptions) {
        // Filter out custom element errors to put them in their own category
        window._uncaughtExceptions.forEach(error => {
            if (error.type === 'CustomElementError' || 
                (error.text && error.text.includes('CustomElementRegistry')) ||
                (error.text && error.text.includes('define') && error.text.includes('already been used'))) {
                collectedErrors.customElementErrors.push(error);
            } else {
                collectedErrors.uncaughtExceptions.push(error);
            }
        });
    }

    // Collect any failed promises stored in window._failedPromises if our error handler set it up
    if (window._failedPromises) {
        collectedErrors.failedPromises = window._failedPromises.slice();
    }

    // Collect errors from iframes
    try {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            try {
                // Try to access the iframe content
                const iframeWindow = iframe.contentWindow;
                const iframeDocument = iframe.contentDocument;
                
                if (iframeWindow && iframeDocument) {
                    // Check if we can access the iframe's console error history
                    if (iframeWindow.console && iframeWindow.console._errorHistory) {
                        iframeWindow.console._errorHistory.forEach(error => {
                            collectedErrors.iframeErrors.push({
                                ...error,
                                iframeIndex: index,
                                iframeSrc: iframe.src || 'unknown',
                                type: 'console-error'
                            });
                        });
                    }
                    
                    // Check for warnings
                    if (iframeWindow.console && iframeWindow.console._warningHistory) {
                        iframeWindow.console._warningHistory.forEach(warning => {
                            collectedErrors.iframeErrors.push({
                                ...warning,
                                iframeIndex: index,
                                iframeSrc: iframe.src || 'unknown',
                                type: 'console-warning'
                            });
                        });
                    }
                    
                    // Check for uncaught exceptions
                    if (iframeWindow._uncaughtExceptions) {
                        iframeWindow._uncaughtExceptions.forEach(exception => {
                            collectedErrors.iframeErrors.push({
                                ...exception,
                                iframeIndex: index,
                                iframeSrc: iframe.src || 'unknown',
                                type: 'uncaught-exception'
                            });
                        });
                    }
                    
                    // Check for failed promises
                    if (iframeWindow._failedPromises) {
                        iframeWindow._failedPromises.forEach(promise => {
                            collectedErrors.iframeErrors.push({
                                ...promise,
                                iframeIndex: index,
                                iframeSrc: iframe.src || 'unknown',
                                type: 'failed-promise'
                            });
                        });
                    }
                }
            } catch (e) {
                // If we can't access the iframe due to same-origin policy, log this information
                collectedErrors.iframeErrors.push({
                    text: 'Cannot access iframe content due to same-origin policy',
                    iframeIndex: index,
                    iframeSrc: iframe.src || 'unknown',
                    type: 'access-error',
                    timestamp: new Date().toISOString()
                });
            }
        });
    } catch (e) {
        console.error('Error collecting iframe errors:', e);
    }

    // Collect errors from the browser console directly
    try {
        // Check if there are any errors in the console that weren't captured by our handlers
        if (window.console && window.console.memory && window.console.memory.jsHeapSizeLimit) {
            // This is just a check to see if we have access to console internals
            // We can't directly access console history in most browsers
            console.log('Collecting errors from console...');
        }
    } catch (e) {
        console.error('Error accessing console memory:', e);
    }

    // Send all collected errors back to the extension
    sendErrorsToExtension();
    
    // Display the collected errors in the console using console.table()
    console.log('Collected Errors Summary:');
    
    if (collectedErrors.consoleErrors.length > 0) {
        console.log('Console Errors:');
        console.table(collectedErrors.consoleErrors);
    }
    
    if (collectedErrors.consoleWarnings.length > 0) {
        console.log('Console Warnings:');
        console.table(collectedErrors.consoleWarnings);
    }
    
    if (collectedErrors.uncaughtExceptions.length > 0) {
        console.log('Uncaught Exceptions:');
        console.table(collectedErrors.uncaughtExceptions);
    }
    
    if (collectedErrors.customElementErrors.length > 0) {
        console.log('Custom Element Errors:');
        console.table(collectedErrors.customElementErrors);
    }
    
    if (collectedErrors.failedPromises.length > 0) {
        console.log('Failed Promises:');
        console.table(collectedErrors.failedPromises);
    }
    
    if (collectedErrors.networkErrors.length > 0) {
        console.log('Network Errors:');
        console.table(collectedErrors.networkErrors);
    }
    
    if (collectedErrors.iframeErrors.length > 0) {
        console.log('Iframe Errors:');
        console.table(collectedErrors.iframeErrors);
    }
    
    return collectedErrors;
}

// Execute the collection function
collectAllErrors(); 