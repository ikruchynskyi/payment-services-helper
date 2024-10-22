import React from 'react';
const Row = (props) => {
    return (
        <div>
            <a href="#" id={props.id} onClick={(e) => e.preventDefault()}>
                {props.children}
            </a>
        </div>
    );
}

export default Row