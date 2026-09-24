require('dotenv').config();
const { login } = require('../src/controllers/authController');

const test = async () => {
    const req = {
        body: {
            email: 'adminsmart00@gmail.com',
            password: '@Dmin1234'
        }
    };
    
    const res = {
        status: (code) => {
            console.log('Status:', code);
            return res;
        },
        json: (data) => {
            console.log('Response JSON:', data);
        }
    };

    await login(req, res);
    process.exit(0);
};

test();
