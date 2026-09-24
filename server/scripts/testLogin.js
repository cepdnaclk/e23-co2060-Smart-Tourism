const axios = require('axios');

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'adminsmart00@gmail.com',
            password: '@Dmin1234'
        });
        console.log('Login successful:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Server error:', error.response.status, error.response.data);
        } else {
            console.error('Request failed:', error.message);
        }
    }
};

testLogin();
