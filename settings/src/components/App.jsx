import React from 'react';
import Row from './Row';
const App = (props) => {
    return <div className="content">
        <Row id="checkApplePay">Validate Apple Pay Certificate</Row>
        <Row id="checkEnabledPaymentMethods">Locate Payment Services on Page</Row>
        <Row id="getPayPalSDK">Check Apple Pay</Row>
        <Row id="getPaymentMethods">Get Checkout Payment Methods</Row>
        <Row id="webReqs">Analyze web requests</Row>
        <Row id="isFastly">Is Magento Cloud ?</Row>
        <Row id="isHyva ">Is Hyva?</Row>
        <Row id="getMixins">Checkout Mixins</Row>
        <Row id="openDocs">Documentations</Row>
    </div>;
}
export default App