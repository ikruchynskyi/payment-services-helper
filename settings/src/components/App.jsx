import React from 'react';
import Row from './Row';
import Pane from './Pane';

const App = (props) => {
    return <div className="content">
        <Pane>
            <Row id="checkApplePay" method={checkApplePay}>Validate Apple Pay Certificate</Row>
            <Row id="checkEnabledPaymentMethods">Locate Payment Services on Page</Row>
            <Row id="getPayPalSDK">Check Apple Pay</Row>
            <Row id="getPaymentMethods">Get Checkout Payment Methods</Row>
            <Row id="webReqs" animate={true}>Analyze web requests</Row>
            <Row id="isFastly">Is Magento Cloud ?</Row>
            <Row id="isHyva ">Is Hyva?</Row>
            <Row id="getMixins">Checkout Mixins</Row>
            <Row id="openDocs">Documentations</Row>
        </Pane>
    </div>;
}
export default App