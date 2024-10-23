import React from 'react';
const Row = (props) => {
    const handleClick = (e) => {
        e.preventDefault();
        const tabConfig = {};
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            tabConfig.activeTab = tabs[0];
            tabConfig.activeTabUrl = tabs[0].url;
            tabConfig.url = new URL(tabs[0].url);
            tabConfig.domain = new URL(tabs[0].url).hostname;

            const method = props.method;
            if (method) {
                method(tabConfig);
            }
        });
    };
    return (
        <div>
            <a href="#" id={props.id} onClick={handleClick}>
                {props.children}
            </a>
        </div>
    );
}

export default Row