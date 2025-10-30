
import React from 'react';
import axios from 'axios';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const HackersBurp = () => {
    const displayRazorpay = async () => {
        const apiUrl = 'https://anonymous-api-tvtx.onrender.com'; 
        const order = await axios.post(`${apiUrl}/create-order`, { amount: 370000 });

        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: order.data.amount, 
            currency: 'INR',
            name: 'HackersBurp Tool',
            description: 'One-time payment for lifetime access',
            order_id: order.data.id,
            handler: async function (response: any) {
                const verification = await axios.post(`${apiUrl}/verify-payment`, response);
                alert(verification.data.message);
            },
            prefill: {
                name: 'Anonymous User',
                email: 'anonymous@example.com',
                contact: '9999999999',
            },
            notes: {
                address: 'Anonymous Address',
            },
            theme: {
                color: '#3399cc',
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return (
        <div className="hacker-theme">
            <div className="page-content">
                <h2>HackersBurp - Web Application Security Testing Tool</h2>
                <p>This tool will provide features similar to Burp Suite for web application security testing.</p>
                <p>To access the full features of this tool, a one-time payment of $45 (approximately 3700 INR) is required.</p>
                <button className="btn btn-primary" onClick={displayRazorpay}>
                    Pay $45 to Unlock
                </button>
                <div className="tool-placeholder">
                    <h3>Tool Interface</h3>
                    <p>The tool interface will be displayed here after successful payment.</p>
                </div>
            </div>
        </div>
    );
};

export default HackersBurp;
