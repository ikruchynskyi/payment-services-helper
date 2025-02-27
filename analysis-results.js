document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const summaryContent = document.getElementById('summary-content');
    const errorDetails = document.getElementById('error-details');
    const solutions = document.getElementById('solutions');
    const perplexityLink = document.getElementById('perplexity-link');
    const analysisTime = document.getElementById('analysis-time');
    const perplexityRawText = document.getElementById('perplexity-raw-text');
    const copyButton = document.getElementById('copy-button');
    
    // Add copy to clipboard functionality
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            const textToCopy = perplexityRawText.textContent;
            navigator.clipboard.writeText(textToCopy).then(function() {
                // Success feedback
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                copyButton.style.backgroundColor = '#2E7D32';
                setTimeout(function() {
                    copyButton.textContent = originalText;
                    copyButton.style.backgroundColor = '';
                }, 2000);
            }, function(err) {
                console.error('Could not copy text: ', err);
                alert('Failed to copy text. Please select and copy manually.');
            });
        });
    }
    
    // Load the last error analysis from storage
    chrome.storage.local.get(['lastErrorAnalysis'], function(result) {
        if (result.lastErrorAnalysis) {
            const { timestamp, pageUrl, formattedErrors } = result.lastErrorAnalysis;
            
            // Display timestamp
            const date = new Date(timestamp);
            analysisTime.textContent = date.toLocaleString();
            
            // Check if the formatted errors are too large for a URL
            const dataSize = new Blob([formattedErrors]).size;
            if (dataSize > 2048) { // 2KB limit
                perplexityLink.classList.add('disabled');
                perplexityLink.title = 'Data is too large for URL (over 2KB)';
                perplexityLink.href = '#';
                perplexityLink.onclick = function(e) {
                    e.preventDefault();
                    alert('The error data is too large to send via URL. Please use the copy button to copy the data and paste it directly into Perplexity.');
                };
            } else {
                // Create Perplexity URL with the formatted errors
                const perplexityUrl = `https://www.perplexity.ai/?q=${encodeURIComponent(formattedErrors)}`;
                perplexityLink.href = perplexityUrl;
            }
            
            // Display raw text for Perplexity
            if (perplexityRawText) {
                perplexityRawText.textContent = formattedErrors;
            }
            
            // Display summary
            summaryContent.innerHTML = `
                <p><strong>Page URL:</strong> ${pageUrl}</p>
                <p><strong>Analysis performed:</strong> ${date.toLocaleString()}</p>
            `;
            
            // Parse and display formatted errors
            displayParsedErrors(formattedErrors);
        } else {
            // No analysis data found
            summaryContent.innerHTML = '<p>No error analysis data found.</p>';
            errorDetails.innerHTML = '<p>No error details available.</p>';
            solutions.innerHTML = '<p>No solutions available.</p>';
            analysisTime.textContent = 'N/A';
            
            if (perplexityRawText) {
                perplexityRawText.textContent = 'No data available';
            }
            
            if (perplexityLink) {
                perplexityLink.classList.add('disabled');
                perplexityLink.href = '#';
                perplexityLink.onclick = function(e) {
                    e.preventDefault();
                };
            }
        }
    });
    
    // Function to display parsed errors
    function displayParsedErrors(formattedText) {
        // Extract sections from the formatted text
        const sections = extractErrorSections(formattedText);
        
        // Build HTML for error details
        let errorDetailsHtml = '';
        
        // Add custom element errors
        if (sections.customElementErrors) {
            errorDetailsHtml += `<div class="error-section">
                <h3>Custom Element Errors</h3>
                ${formatErrorSection(sections.customElementErrors)}
            </div>`;
        }
        
        // Add uncaught exceptions
        if (sections.uncaughtExceptions) {
            errorDetailsHtml += `<div class="error-section">
                <h3>Uncaught Exceptions</h3>
                ${formatErrorSection(sections.uncaughtExceptions)}
            </div>`;
        }
        
        // Add failed promises
        if (sections.failedPromises) {
            errorDetailsHtml += `<div class="error-section">
                <h3>Failed Promises</h3>
                ${formatErrorSection(sections.failedPromises)}
            </div>`;
        }
        
        // Add console errors
        if (sections.consoleErrors) {
            errorDetailsHtml += `<div class="error-section">
                <h3>Console Errors</h3>
                ${formatErrorSection(sections.consoleErrors)}
            </div>`;
        }
        
        // Add network errors
        if (sections.networkErrors) {
            errorDetailsHtml += `<div class="error-section">
                <h3>Network Errors</h3>
                ${formatErrorSection(sections.networkErrors)}
            </div>`;
        }
        
        // Add iframe errors
        if (sections.iframeErrors) {
            errorDetailsHtml += `<div class="error-section">
                <h3>Iframe Errors</h3>
                ${formatErrorSection(sections.iframeErrors)}
            </div>`;
        }
        
        // Display error details
        if (errorDetailsHtml) {
            errorDetails.innerHTML = errorDetailsHtml;
        } else {
            errorDetails.innerHTML = '<p>No specific error details found in the analysis.</p>';
        }
        
        // Display solutions
        if (sections.solutions) {
            solutions.innerHTML = `<div class="solutions">${sections.solutions}</div>`;
        } else {
            solutions.innerHTML = '<p>No solution recommendations available. View the full analysis in Perplexity for more details.</p>';
        }
    }
    
    // Function to extract error sections from the formatted text
    function extractErrorSections(text) {
        const sections = {};
        
        // Extract page context
        const pageContextMatch = text.match(/Page URL: (.+)\nUser Agent:/);
        if (pageContextMatch) {
            sections.pageUrl = pageContextMatch[1];
        }
        
        // Extract custom element errors
        const customElementMatch = text.match(/## Custom Element Errors \((\d+)\):\n([\s\S]*?)(?=\n##|\n$)/);
        if (customElementMatch) {
            sections.customElementErrors = customElementMatch[2];
        }
        
        // Extract uncaught exceptions
        const exceptionsMatch = text.match(/## Uncaught Exceptions \((\d+)\):\n([\s\S]*?)(?=\n##|\n$)/);
        if (exceptionsMatch) {
            sections.uncaughtExceptions = exceptionsMatch[2];
        }
        
        // Extract failed promises
        const promisesMatch = text.match(/## Failed Promises \((\d+)\):\n([\s\S]*?)(?=\n##|\n$)/);
        if (promisesMatch) {
            sections.failedPromises = promisesMatch[2];
        }
        
        // Extract console errors
        const consoleMatch = text.match(/## Console Errors \((\d+)\):\n([\s\S]*?)(?=\n##|\n$)/);
        if (consoleMatch) {
            sections.consoleErrors = consoleMatch[2];
        }
        
        // Extract network errors
        const networkMatch = text.match(/## Network Errors \((\d+)\):\n([\s\S]*?)(?=\n##|\n$)/);
        if (networkMatch) {
            sections.networkErrors = networkMatch[2];
        }
        
        // Extract iframe errors
        const iframeMatch = text.match(/## Iframe Errors \((\d+)\):\n([\s\S]*?)(?=\n$)/);
        if (iframeMatch) {
            sections.iframeErrors = iframeMatch[2];
        }
        
        return sections;
    }
    
    // Function to format an error section
    function formatErrorSection(sectionText) {
        let html = '<div class="error-items">';
        
        // Split into individual errors
        const errorItems = sectionText.split(/### .* Error \d+:/g).filter(item => item.trim());
        
        // If no items found, try another approach
        if (errorItems.length === 0) {
            // Just display the raw text with basic formatting
            html += `<div class="error-item">
                <pre>${sectionText}</pre>
            </div>`;
        } else {
            // Format each error item
            errorItems.forEach(item => {
                const messageMatch = item.match(/Message: (.*)/);
                const urlMatch = item.match(/URL: (.*)/);
                const locationMatch = item.match(/Location: (.*)/);
                const stackMatch = item.match(/Stack Trace:\n([\s\S]*?)(?=\n\w|$)/);
                
                html += `<div class="error-item">`;
                
                if (messageMatch) {
                    html += `<div class="error-message">${messageMatch[1]}</div>`;
                }
                
                if (urlMatch) {
                    html += `<div><strong>URL:</strong> ${urlMatch[1]}</div>`;
                }
                
                if (locationMatch) {
                    html += `<div class="error-location">${locationMatch[1]}</div>`;
                }
                
                if (stackMatch) {
                    html += `<div class="error-stack">${stackMatch[1]}</div>`;
                }
                
                html += `</div>`;
            });
        }
        
        html += '</div>';
        return html;
    }
});