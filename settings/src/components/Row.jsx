import React from 'react';
const Row = (props) => {
    const handleClick = (e) => {
        e.preventDefault();
        // Get Chrome from some context
        var tabConfig = {};
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            tabConfig.activeTab = tabs[0];
            tabConfig.activeTabUrl = tabs[0].url;
            tabConfig.url = new URL(tabs[0].url);
            tabConfig.domain = new URL(tabs[0].url).hostname;
        });

        if (method) {
            method(tabConfig);
        }
    };
    return (
        <div>
            <a href="#" id={props.id} onClick={(e) => handleClick(e)}>
                {props.children}
            </a>
        </div>
    );
}

export default Row