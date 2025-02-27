function iframeErrorLogger() {
    // Initialize arrays to store different types of errors
    window._uncaughtExceptions = window._uncaughtExceptions || [];
    window._failedPromises = window._failedPromises || [];
    
    // Initialize console error and warning history if not already done
    if (!window.console._errorHistory) {
        window.console._errorHistory = [];
    }
    
    if (!window.console._warningHistory) {
        window.console._warningHistory = [];
    }

    // Store original methods that we'll override
    const originalDefineCustomElement = window.customElements && window.customElements.define;
    
    // Override customElements.define to catch custom element registration errors
    if (window.customElements && originalDefineCustomElement) {
        window.customElements.define = function(name, constructor, options) {
            try {
                return originalDefineCustomElement.call(this, name, constructor, options);
            } catch (error) {
                // Create error details
                const errorDetails = {
                    text: error.message,
                    stack: error.stack,
                    type: 'CustomElementError',
                    elementName: name,
                    timestamp: new Date().toISOString()
                };
                
                // Store and send the error
                window._uncaughtExceptions.push(errorDetails);
                handleIframeError(errorDetails, 'custom-element-error');
                
                // Re-throw the error to maintain original behavior
                throw error;
            }
        };
    }

    // Function to handle errors and send them to the parent window
    function handleIframeError(errorDetails, errorType) {
        // Add iframe source information
        errorDetails.iframeSource = window.location.href;
        errorDetails.errorType = errorType;
        errorDetails.timestamp = errorDetails.timestamp || new Date().toISOString();
        
        // Try to send the error to the parent window
        try {
            window.parent.postMessage({
                type: 'IFRAME_ERROR',
                error: errorDetails
            }, '*');
        } catch (e) {
            console.error('Failed to send error to parent window:', e);
        }
        
        return errorDetails;
    }

    // Enhanced error handler for uncaught errors
    window.addEventListener('error', function(e) {
        // Don't process errors that have already been handled
        if (e.defaultPrevented) {
            return;
        }
        
        if (e.filename) {
            const errorDetails = {
                stack: e.error ? e.error.stack : null,
                url: e.filename,
                line: e.lineno,
                col: e.colno,
                text: e.message,
                errorName: e.error ? e.error.name : 'Unknown',
                errorType: 'UncaughtError',
                timestamp: new Date().toISOString()
            };
            
            window._uncaughtExceptions.push(errorDetails);
            handleIframeError(errorDetails, 'uncaught-exception');
        }
    }, true); // Use capture phase to catch errors before they bubble up

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        if (typeof e.reason === 'undefined') {
            e.reason = e.detail;
        }
        
        const errorDetails = {
            text: e.reason.message || 'Promise rejected',
            stack: e.reason.stack,
            errorName: e.reason.name || 'UnhandledRejection',
            timestamp: new Date().toISOString()
        };
        
        window._failedPromises.push(errorDetails);
        handleIframeError(errorDetails, 'failed-promise');
    });

    // Override console.error
    const originalConsoleError = window.console.error;
    window.console.error = function() {
        // Call the original console.error
        originalConsoleError.apply(console, arguments);
        
        // Format the error message
        const argsArray = Array.from(arguments);
        const errorMessage = argsArray.length == 1 && typeof argsArray[0] == 'string' ? 
            argsArray[0] : JSON.stringify(argsArray.length == 1 ? argsArray[0] : argsArray);
        
        // Create error details
        const errorDetails = {
            text: errorMessage,
            timestamp: new Date().toISOString()
        };
        
        // Store and send the error
        window.console._errorHistory.push(errorDetails);
        handleIframeError(errorDetails, 'console-error');
    };

    // Override console.warn
    const originalConsoleWarn = window.console.warn;
    window.console.warn = function() {
        // Call the original console.warn
        originalConsoleWarn.apply(console, arguments);
        
        // Format the warning message
        const argsArray = Array.from(arguments);
        const warningMessage = argsArray.length == 1 && typeof argsArray[0] == 'string' ? 
            argsArray[0] : JSON.stringify(argsArray.length == 1 ? argsArray[0] : argsArray);
        
        // Create warning details
        const warningDetails = {
            text: warningMessage,
            timestamp: new Date().toISOString()
        };
        
        // Store and send the warning
        window.console._warningHistory.push(warningDetails);
        handleIframeError(warningDetails, 'console-warning');
    };

    // Handle 404 errors for resources
    window.addEventListener('error', function(e) {
        var src = e.target.src || e.target.href;
        var baseUrl = e.target.baseURI;
        
        if (src && baseUrl && src != baseUrl) {
            const errorDetails = {
                is404: true,
                url: src,
                timestamp: new Date().toISOString()
            };
            
            window._uncaughtExceptions.push(errorDetails);
            handleIframeError(errorDetails, '404-error');
        }
    }, true);

    // Add a global error handler to catch errors that might be missed by other handlers
    window.onerror = function(message, source, lineno, colno, error) {
        const errorDetails = {
            text: message,
            url: source,
            line: lineno,
            col: colno,
            stack: error ? error.stack : null,
            errorName: error ? error.name : 'Unknown',
            errorType: 'GlobalError',
            timestamp: new Date().toISOString()
        };
        
        // Check if this error is already in the uncaught exceptions
        const isDuplicate = window._uncaughtExceptions.some(e => 
            e.text === errorDetails.text && 
            e.url === errorDetails.url && 
            e.line === errorDetails.line
        );
        
        if (!isDuplicate) {
            window._uncaughtExceptions.push(errorDetails);
            handleIframeError(errorDetails, 'global-error');
        }
        
        // Return false to allow the error to propagate to the browser's console
        return false;
    };

    // Log that the iframe error logger has been initialized
    console.log('Iframe error logger initialized in:', window.location.href);
}

// Execute the function
iframeErrorLogger(); 