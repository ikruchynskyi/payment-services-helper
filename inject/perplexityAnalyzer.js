/**
 * Perplexity Error Analyzer
 * This module sends collected errors to Perplexity AI for analysis
 */

class PerplexityAnalyzer {
    constructor() {
        this.apiKey = ''; // You'll need to set this via the extension settings
        this.apiEndpoint = 'https://api.perplexity.ai/chat/completions';
        this.model = 'mixtral-8x7b-instruct'; // Default model
    }

    /**
     * Set the API key for Perplexity
     * @param {string} apiKey - The Perplexity API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Set the model to use for analysis
     * @param {string} model - The model name
     */
    setModel(model) {
        this.model = model;
    }

    /**
     * Add context to an error object
     * @param {Object} error - The error object
     * @param {string} pageUrl - The URL of the page where the error occurred
     * @param {string} userAgent - The user agent string
     * @param {Object} additionalContext - Any additional context to include
     * @returns {Object} - The error with added context
     */
    addContextToError(error, pageUrl, userAgent, additionalContext = {}) {
        return {
            ...error,
            pageUrl,
            userAgent,
            timestamp: error.timestamp || new Date().toISOString(),
            additionalContext
        };
    }

    /**
     * Format errors for analysis
     * @param {Object} allErrors - The collected errors object
     * @param {string} pageUrl - The URL of the page where the errors occurred
     * @returns {string} - Formatted error data as a string
     */
    formatErrorsForAnalysis(allErrors, pageUrl) {
        const userAgent = navigator.userAgent;
        let formattedErrors = `Error Analysis Request\n`;
        formattedErrors += `Page URL: ${pageUrl}\n`;
        formattedErrors += `User Agent: ${userAgent}\n`;
        formattedErrors += `Timestamp: ${new Date().toISOString()}\n\n`;

        // Add each error category
        if (allErrors.customElementErrors && allErrors.customElementErrors.length > 0) {
            formattedErrors += `## Custom Element Errors (${allErrors.customElementErrors.length}):\n`;
            allErrors.customElementErrors.forEach((error, index) => {
                formattedErrors += this.formatSingleError(error, index, 'CustomElement');
            });
        }

        if (allErrors.uncaughtExceptions && allErrors.uncaughtExceptions.length > 0) {
            formattedErrors += `\n## Uncaught Exceptions (${allErrors.uncaughtExceptions.length}):\n`;
            allErrors.uncaughtExceptions.forEach((error, index) => {
                formattedErrors += this.formatSingleError(error, index, 'Exception');
            });
        }

        if (allErrors.failedPromises && allErrors.failedPromises.length > 0) {
            formattedErrors += `\n## Failed Promises (${allErrors.failedPromises.length}):\n`;
            allErrors.failedPromises.forEach((error, index) => {
                formattedErrors += this.formatSingleError(error, index, 'Promise');
            });
        }

        if (allErrors.consoleErrors && allErrors.consoleErrors.length > 0) {
            formattedErrors += `\n## Console Errors (${allErrors.consoleErrors.length}):\n`;
            allErrors.consoleErrors.forEach((error, index) => {
                formattedErrors += this.formatSingleError(error, index, 'Console');
            });
        }

        if (allErrors.networkErrors && allErrors.networkErrors.length > 0) {
            formattedErrors += `\n## Network Errors (${allErrors.networkErrors.length}):\n`;
            allErrors.networkErrors.forEach((error, index) => {
                formattedErrors += this.formatSingleError(error, index, 'Network');
            });
        }

        if (allErrors.iframeErrors && allErrors.iframeErrors.length > 0) {
            formattedErrors += `\n## Iframe Errors (${allErrors.iframeErrors.length}):\n`;
            allErrors.iframeErrors.forEach((error, index) => {
                formattedErrors += this.formatSingleError(error, index, 'Iframe');
            });
        }

        return formattedErrors;
    }

    /**
     * Format a single error for analysis
     * @param {Object} error - The error object
     * @param {number} index - The index of the error
     * @param {string} category - The category of the error
     * @returns {string} - Formatted error as a string
     */
    formatSingleError(error, index, category) {
        let formatted = `\n### ${category} Error ${index + 1}:\n`;
        
        if (error.text) {
            formatted += `Message: ${error.text}\n`;
        }
        
        if (error.url) {
            formatted += `URL: ${error.url}\n`;
        }
        
        if (error.line && error.col) {
            formatted += `Location: Line ${error.line}, Column ${error.col}\n`;
        }
        
        if (error.stack) {
            formatted += `Stack Trace:\n\`\`\`\n${error.stack}\n\`\`\`\n`;
        }
        
        if (error.timestamp) {
            formatted += `Time: ${error.timestamp}\n`;
        }
        
        if (category === 'Iframe' && error.iframeSrc) {
            formatted += `Iframe Source: ${error.iframeSrc}\n`;
        }
        
        if (error.elementName) {
            formatted += `Element Name: ${error.elementName}\n`;
        }
        
        return formatted;
    }

    /**
     * Create a prompt for Perplexity to analyze the errors
     * @param {string} formattedErrors - The formatted error data
     * @returns {string} - The prompt for Perplexity
     */
    createAnalysisPrompt(formattedErrors) {
        return `You are an expert JavaScript and web development troubleshooter. Please analyze the following errors collected from a web page and provide:

1. A summary of the errors
2. Likely root causes for each type of error
3. Potential solutions or fixes
4. Any patterns or relationships between the errors
5. Recommendations for debugging

Here are the errors:

${formattedErrors}

Please provide a detailed analysis that would help a developer understand and fix these issues.`;
    }

    /**
     * Send errors to Perplexity for analysis
     * @param {Object} allErrors - The collected errors object
     * @param {string} pageUrl - The URL of the page where the errors occurred
     * @returns {Promise<Object>} - The analysis result from Perplexity
     */
    async analyzeErrors(allErrors, pageUrl) {
        if (!this.apiKey) {
            throw new Error('Perplexity API key is not set. Please set it in the extension settings.');
        }

        // Format the errors for analysis
        const formattedErrors = this.formatErrorsForAnalysis(allErrors, pageUrl);
        
        // Create the prompt for Perplexity
        const prompt = this.createAnalysisPrompt(formattedErrors);

        // Prepare the request to Perplexity
        const requestBody = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: "You are an expert JavaScript and web development troubleshooter who analyzes errors and provides detailed explanations and solutions."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        };

        try {
            // Send the request to Perplexity
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error sending errors to Perplexity:', error);
            throw error;
        }
    }

    /**
     * Process the analysis result from Perplexity
     * @param {Object} analysisResult - The analysis result from Perplexity
     * @returns {Object} - The processed analysis
     */
    processAnalysisResult(analysisResult) {
        // Extract the analysis content from the Perplexity response
        const analysis = analysisResult.choices[0].message.content;
        
        // You could further process or structure the analysis here if needed
        
        return {
            timestamp: new Date().toISOString(),
            analysis
        };
    }

    /**
     * Display the analysis result in the console
     * @param {Object} processedAnalysis - The processed analysis
     */
    displayAnalysisInConsole(processedAnalysis) {
        console.log('%c Error Analysis from Perplexity AI ', 'background: #6F4BD8; color: white; font-size: 16px; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
        console.log(processedAnalysis.analysis);
    }

    /**
     * Create a visual report of the analysis
     * @param {Object} processedAnalysis - The processed analysis
     * @returns {string} - HTML content for the report
     */
    createAnalysisReport(processedAnalysis) {
        // Convert the analysis text to HTML with proper formatting
        const analysisHtml = processedAnalysis.analysis
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error Analysis Report</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1, h2, h3 {
                    color: #6F4BD8;
                }
                pre {
                    background-color: #f5f5f5;
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                code {
                    font-family: 'Courier New', Courier, monospace;
                }
                .timestamp {
                    color: #666;
                    font-size: 0.9em;
                    margin-bottom: 20px;
                }
                .header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .logo {
                    width: 40px;
                    height: 40px;
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <svg class="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#6F4BD8"/>
                    <path d="M2 17L12 22L22 17" stroke="#6F4BD8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#6F4BD8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h1>Error Analysis Report</h1>
            </div>
            <div class="timestamp">Generated on: ${processedAnalysis.timestamp}</div>
            <div class="analysis">
                <p>${analysisHtml}</p>
            </div>
        </body>
        </html>
        `;
    }
}

// Export the analyzer
window.PerplexityAnalyzer = new PerplexityAnalyzer(); 