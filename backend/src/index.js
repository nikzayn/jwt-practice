require('../backend/node_modules/dotenv/config')

const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { verify } = require('jsonwebtoken')
const { hash, compare } = require('bcryptjs')

const app = express();

//Use express middleware for easy cookie handling
app.use(cookieParser());

app.use(
    cors({
        origin: 'http://localhost:3000',
        credentials: true
    })
);

//To read body data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { fakeDB } = require('./fakeDB');
const {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
} = require('./tokens');
const { isAuth } = require('./isAuth');

//1. Register a user
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        //1. Check if user exists
        const user = fakeDB.find(user => user.email === email);
        if (user) throw new Error('User already exists');
        //2. If user doesn;t exist, hash the password
        const hashedPassword = await hash(password, 10);
        //3. Save the user in database
        fakeDB.push({
            id: fakeDB.length,
            email,
            password: hashedPassword
        });
        res.send({ message: 'User Created' });
        console.log(fakeDB);
    }
    catch (err) {
        res.send({
            error: `${err.message}`,
        });
    }
});

//2. Login a user
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        //1. Check user in DB, if not send error
        const user = fakeDB.find(user => user.email === email);
        if (!user) throw new Error('User does not exist');
        //2. Compare crypted password and see if it checks out. Send error if not
        const valid = await compare(password, user.password);
        if (!valid) throw new Error('Password not correct');
        //3. Create refresh and access token
        const accessToken = createAccessToken(user.id);
        const refreshToken = createRefreshToken(user.id);
        //4. Put the refresh token in the DB
        user.refreshToken = refreshToken;
        console.log(fakeDB);
        //5. Send token. Refreshtoken as a cookie and accessToken as a regular response
        sendRefreshToken(res, refreshToken);
        sendAccessToken(req, res, accessToken);
    }
    catch (err) {
        res.send({
            error: `${err.message}`,
        });
    }
})

//3. Logout a user
app.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', { path: '/refresh_token' });
    return res.send({
        message: 'Logged out',
    })
});

//4. Setup a protected route
app.post('/protected', async (req, res) => {
    try {
        const userId = isAuth(req);
        res.send({
            data: 'This is protected data.',
        })
    }
    catch (err) {
        res.send({
            message: `${err.message}`
        })
    }
})

//5. Get a new access token with refresh token 
app.post('/refresh_token', (req, res) => {
    const token = req.cookies.refreshToken;
    //If we don't have a token in our request
    if (!token) return res.send({ accessToken: '' })
    //If we have it, then let's verify the token
    let payload = null;
    try {
        payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch{
        res.send({ accessToken: '' });
    }
    //Token is valid, check if user's exist
    const user = fakeDB.find(user => user.id === payload.userId);
    if (!user) return res.send({ accessToken: '' });
    //user exist, check if refresh token exist on user
    if (user.refreshToken !== token) {
        return res.send({ accessToken: '' });
    }
    //Token exist, create new refresh and access token
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    user.refreshToken = refreshToken;
    //All good to go, send new refresh and access tokens
    sendRefreshToken(res, refreshToken);
    return res.send({ accessToken });
})

app.listen(process.env.PORT, () => {
    console.log(`Listeing on port ${process.env.PORT}`)
})