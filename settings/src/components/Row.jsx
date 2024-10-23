import React from 'react';
import { useState } from 'react';

const Row = (props) => {
    const handleClick = (e) => {
        e.preventDefault();
        const tabConfig = {};
        if (props.animate) {
            setLoading(!loading);
        }
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
    const [loading, setLoading] = useState(false);
    const loadingClass = loading ? 'loading-bar' : '';
    return (
        <div>
            <a href="#" id={props.id} onClick={handleClick} className={loadingClass}>
                {props.children}
            </a>
        </div>
    );
};

Row.defaultProps = {
    animate: false
};

export default Row